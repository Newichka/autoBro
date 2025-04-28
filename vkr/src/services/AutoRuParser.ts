import axios from 'axios';

// Интерфейс для автомобиля с Авто.ру, адаптированный под существующую модель Car
export interface AutoRuCar {
  id: number;
  make: string;
  model: string;
  year: number;
  bodyTypeName: string;
  price: number;
  mileage: number;
  engineInfo: string;
  transmissionInfo: string;
  colorName: string;
  condition: string;
  location: string;
  mainPhotoUrl: string;
  allPhotoUrls: string[];
  safetyFeatures: string[];
  equipment: string[];
  technicalSpec: {
    fuelType: string;
    engineVolume: number;
    horsePower: number;
    driveType: string;
    transmissionType: string;
    gears: number;
  };
  createdAt: string;
  updatedAt: string;
  source: string; // Добавляем поле для отслеживания источника данных
}

// Интерфейс для параметров запроса к Авто.ру
export interface AutoRuParams {
  make?: string[];
  model?: string[];
  minYear?: number;
  maxYear?: number;
  minPrice?: number;
  maxPrice?: number;
  minMileage?: number;
  maxMileage?: number;
  bodyType?: string[];
  fuelType?: string[];
  minHorsePower?: number;
  transmissionType?: string[];
  driveType?: string[];
  color?: string[];
  page?: number;
  pageSize?: number;
}

// Класс для работы с данными Авто.ру
export class AutoRuParser {
  // Прокси-сервер для обхода CORS
  private proxyUrl: string = 'https://cors-anywhere.herokuapp.com/';
  
  // Базовый URL для API Авто.ру (заглушка, так как прямой доступ к API Авто.ру ограничен)
  private baseUrl: string = 'https://auto.ru/api/cars';
  
  // Метод для получения данных с Авто.ру с учетом фильтров
  async fetchCars(params: AutoRuParams): Promise<AutoRuCar[]> {
    try {
      // В реальном проекте здесь был бы запрос к API Авто.ру
      // Но поскольку прямой доступ к API Авто.ру ограничен,
      // мы будем использовать имитацию данных
      
      console.log('Запрос к Авто.ру с параметрами:', params);
      
      // Имитация задержки сетевого запроса
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Генерируем тестовые данные на основе параметров фильтрации
      return this.generateMockData(params);
    } catch (error) {
      console.error('Ошибка при получении данных с Авто.ру:', error);
      throw error;
    }
  }
  
  // Метод для генерации тестовых данных
  private generateMockData(params: AutoRuParams): AutoRuCar[] {
    // Базовые марки и модели для тестовых данных
    const makes = ['Toyota', 'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Honda', 'Lexus', 'Ford', 'Hyundai', 'Kia'];
    const models: Record<string, string[]> = {
      'Toyota': ['Camry', 'Corolla', 'RAV4', 'Land Cruiser', 'Highlander'],
      'BMW': ['3 Series', '5 Series', 'X5', 'X3', '7 Series'],
      'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'GLE', 'GLC'],
      'Audi': ['A4', 'A6', 'Q5', 'Q7', 'A3'],
      'Volkswagen': ['Golf', 'Passat', 'Tiguan', 'Polo', 'Touareg'],
      'Honda': ['Civic', 'Accord', 'CR-V', 'Pilot', 'HR-V'],
      'Lexus': ['RX', 'ES', 'NX', 'GX', 'LS'],
      'Ford': ['Focus', 'Mustang', 'Explorer', 'F-150', 'Escape'],
      'Hyundai': ['Elantra', 'Tucson', 'Santa Fe', 'Sonata', 'Kona'],
      'Kia': ['Sportage', 'Sorento', 'Optima', 'Rio', 'Seltos']
    };
    
    // Типы кузова
    const bodyTypes = ['Седан', 'Хэтчбек', 'Универсал', 'Внедорожник', 'Кроссовер', 'Купе', 'Кабриолет'];
    
    // Типы топлива
    const fuelTypes = ['Бензин', 'Дизель', 'Гибрид', 'Электро'];
    
    // Типы трансмиссии
    const transmissionTypes = ['Автоматическая', 'Механическая', 'Вариатор', 'Робот'];
    
    // Типы привода
    const driveTypes = ['Передний', 'Задний', 'Полный'];
    
    // Цвета
    const colors = ['Черный', 'Белый', 'Серый', 'Красный', 'Синий', 'Зеленый', 'Серебристый'];
    
    // Фильтрация марок на основе параметров
    let filteredMakes = makes;
    if (params.make && params.make.length > 0) {
      filteredMakes = makes.filter(make => params.make!.includes(make));
    }
    
    // Количество автомобилей для генерации
    const count = Math.min(20, Math.max(5, Math.floor(Math.random() * 15) + 5));
    
    // Генерируем случайные автомобили
    const cars: AutoRuCar[] = [];
    
    for (let i = 0; i < count; i++) {
      // Выбираем случайную марку из отфильтрованных
      const make = filteredMakes[Math.floor(Math.random() * filteredMakes.length)];
      
      // Выбираем случайную модель для выбранной марки
      const modelOptions = models[make] || ['Модель'];
      let model = modelOptions[Math.floor(Math.random() * modelOptions.length)];
      
      // Если указаны модели в параметрах, фильтруем
      if (params.model && params.model.length > 0) {
        // Если нет совпадений с запрошенными моделями, пропускаем
        if (!params.model.some(m => model.toLowerCase().includes(m.toLowerCase()))) {
          continue;
        }
      }
      
      // Генерируем случайный год в диапазоне
      const minYear = params.minYear || 2010;
      const maxYear = params.maxYear || 2025;
      const year = Math.floor(Math.random() * (maxYear - minYear + 1)) + minYear;
      
      // Генерируем случайную цену в диапазоне
      const minPrice = params.minPrice || 500000;
      const maxPrice = params.maxPrice || 5000000;
      const price = Math.floor(Math.random() * (maxPrice - minPrice + 1)) + minPrice;
      
      // Генерируем случайный пробег в диапазоне
      const minMileage = params.minMileage || 0;
      const maxMileage = params.maxMileage || 150000;
      const mileage = Math.floor(Math.random() * (maxMileage - minMileage + 1)) + minMileage;
      
      // Выбираем случайный тип кузова
      const bodyType = bodyTypes[Math.floor(Math.random() * bodyTypes.length)];
      
      // Если указаны типы кузова в параметрах, фильтруем
      if (params.bodyType && params.bodyType.length > 0) {
        if (!params.bodyType.some(bt => bodyType.toLowerCase().includes(bt.toLowerCase()))) {
          continue;
        }
      }
      
      // Выбираем случайный тип топлива
      const fuelType = fuelTypes[Math.floor(Math.random() * fuelTypes.length)];
      
      // Если указаны типы топлива в параметрах, фильтруем
      if (params.fuelType && params.fuelType.length > 0) {
        if (!params.fuelType.some(ft => fuelType.toLowerCase().includes(ft.toLowerCase()))) {
          continue;
        }
      }
      
      // Выбираем случайный тип трансмиссии
      const transmissionType = transmissionTypes[Math.floor(Math.random() * transmissionTypes.length)];
      
      // Если указаны типы трансмиссии в параметрах, фильтруем
      if (params.transmissionType && params.transmissionType.length > 0) {
        if (!params.transmissionType.some(tt => transmissionType.toLowerCase().includes(tt.toLowerCase()))) {
          continue;
        }
      }
      
      // Выбираем случайный тип привода
      const driveType = driveTypes[Math.floor(Math.random() * driveTypes.length)];
      
      // Если указаны типы привода в параметрах, фильтруем
      if (params.driveType && params.driveType.length > 0) {
        if (!params.driveType.some(dt => driveType.toLowerCase().includes(dt.toLowerCase()))) {
          continue;
        }
      }
      
      // Выбираем случайный цвет
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      // Если указаны цвета в параметрах, фильтруем
      if (params.color && params.color.length > 0) {
        if (!params.color.some(c => color.toLowerCase().includes(c.toLowerCase()))) {
          continue;
        }
      }
      
      // Генерируем случайную мощность двигателя
      const minHorsePower = params.minHorsePower || 100;
      const maxHorsePower = 400;
      const horsePower = Math.floor(Math.random() * (maxHorsePower - minHorsePower + 1)) + minHorsePower;
      
      // Генерируем случайный объем двигателя
      const engineVolume = (Math.floor(Math.random() * 30) + 10) / 10; // от 1.0 до 4.0
      
      // Генерируем случайное количество передач
      const gears = Math.floor(Math.random() * 4) + 5; // от 5 до 8
      
      // Генерируем реальные URL фотографий вместо placeholder
      const photoCount = Math.floor(Math.random() * 5) + 1; // от 1 до 5 фото
      const carId = i + 1;
      
      // Используем реальные изображения автомобилей вместо placeholder
      const carImages = [
        `https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80`,
        `https://images.unsplash.com/photo-1494976388531-d1058494cdd8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80`,
        `https://images.unsplash.com/photo-1553440569-bcc63803a83d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80`,
        `https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80`,
        `https://images.unsplash.com/photo-1542362567-b07e54358753?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80`
      ];
      
      // Выбираем случайные изображения для этого автомобиля
      const allPhotoUrls = [];
      const usedIndices = new Set<number>();
      
      for (let j = 0; j < photoCount; j++) {
        let randomIndex;
        do {
          randomIndex = Math.floor(Math.random() * carImages.length);
        } while (usedIndices.has(randomIndex) && usedIndices.size < carImages.length);
        
        usedIndices.add(randomIndex);
        allPhotoUrls.push(carImages[randomIndex]);
      }
      
      // Генерируем случайные функции безопасности
      const safetyFeatures = ['ABS', 'ESP', 'Подушки безопасности', 'Система контроля слепых зон', 'Система помощи при парковке']
        .filter(() => Math.random() > 0.5);
      
      // Генерируем случайное оборудование
      const equipment = ['Климат-контроль', 'Круиз-контроль', 'Кожаный салон', 'Навигационная система', 'Подогрев сидений', 'Камера заднего вида']
        .filter(() => Math.random() > 0.5);
      
      // Создаем объект автомобиля
      const car: AutoRuCar = {
        id: 1000000 + i, // Используем большие ID, чтобы не конфликтовать с существующими
        make,
        model,
        year,
        bodyTypeName: bodyType,
        price,
        mileage,
        engineInfo: `${fuelType} ${engineVolume}L ${horsePower}HP`,
        transmissionInfo: transmissionType,
        colorName: color,
        condition: year > 2022 ? 'Новый' : 'Подержанный',
        location: 'Москва, Россия',
        mainPhotoUrl: allPhotoUrls[0],
        allPhotoUrls,
        safetyFeatures,
        equipment,
        technicalSpec: {
          fuelType,
          engineVolume,
          horsePower,
          driveType,
          transmissionType,
          gears
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'auto.ru'
      };
      
      cars.push(car);
    }
    
    return cars;
  }
}

export default new AutoRuParser();
