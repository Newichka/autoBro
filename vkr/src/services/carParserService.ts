import axios from 'axios';

export interface ParsedCar {
  id: string;
  title: string;
  price: number;
  year: number;
  make: string;
  model: string;
  color: string;
  url: string;
  imageUrl: string;
  source: string;
  location?: string;
  auctionDate?: string;
}

export interface CarSearchCriteria {
  make: string;
  model: string;
  year?: number;
  minPrice?: number;
  maxPrice?: number;
  color?: string;
}

// Валидация критериев поиска
function validateCriteria(criteria: CarSearchCriteria): string | null {
  if (!criteria.make || !criteria.model) {
    return 'Марка и модель автомобиля обязательны';
  }
  if (criteria.year && (criteria.year < 1900 || criteria.year > new Date().getFullYear())) {
    return 'Некорректный год выпуска';
  }
  if (criteria.minPrice && criteria.maxPrice && criteria.minPrice > criteria.maxPrice) {
    return 'Минимальная цена не может быть больше максимальной';
  }
  return null;
}

export const parseCars = async (criteria: CarSearchCriteria): Promise<ParsedCar[]> => {
  // Валидация входных данных
  const validationError = validateCriteria(criteria);
  if (validationError) {
    throw new Error(validationError);
  }

  try {
    console.log('Отправка запроса на парсинг:', criteria);
    const response = await axios.post('http://localhost:3001/api/parse-cars', criteria, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60 секунд таймаут
    });
    
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Неверный формат данных от сервера');
    }

    // Валидация полученных данных
    const validCars = response.data.filter((car: any) => {
      return (
        car.id &&
        car.title &&
        typeof car.price === 'number' &&
        typeof car.year === 'number' &&
        car.make &&
        car.model &&
        car.color &&
        car.url &&
        car.imageUrl &&
        car.source
      );
    });

    if (validCars.length === 0) {
      throw new Error('Не найдено подходящих автомобилей');
    }
    
    return validCars;
  } catch (error) {
    console.error('Ошибка при парсинге:', error);
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Превышено время ожидания ответа от сервера');
      }
      if (error.response) {
        throw new Error(`Ошибка сервера: ${error.response.status}`);
      }
      if (error.request) {
        throw new Error('Нет ответа от сервера');
      }
    }
    throw error instanceof Error ? error : new Error('Ошибка при парсинге автомобилей');
  }
}; 