import axios from 'axios';

// Интерфейс для "сырых" данных автомобиля, получаемых парсером
export interface RawParsedCar {
  make: string;
  model: string;
  year: number;
  price: number;
  mileage?: number;
  engine?: string; // Например: "Бензин, 2.0 л, 150 л.с."
  horsePower?: number;
  color?: string;  // Например: "Черный"
  imageUrl?: string;
  city?: string;
  bodyType?: string;
  transmission?: string;
  drive?: string;
  url?: string; // URL детальной страницы автомобиля
}

// Эта функция будет импортирована MainContainer.tsx
// Мы заменяем ее реализацию на парсер avtogermes.ru
export async function parseCars(url: string): Promise<RawParsedCar[]> {
  // URL должен быть для avtogermes.ru
  console.log(`Парсинг автомобилей с avtogermes.ru: ${url}`);
  const cars: RawParsedCar[] = [];
  const processedUrls = new Set<string>(); // Для отслеживания уже обработанных URL
  const processedCars = new Set<string>(); // Для отслеживания уникальных автомобилей

  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });
    const html = response.data; // Реальный HTML от avtogermes.ru

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Ищем все карточки автомобилей по классу second-car-card
    const carCards = doc.querySelectorAll('.second-car-card');
    console.log(`Найдено ${carCards.length} карточек автомобилей на avtogermes.ru`);

    // Обрабатываем каждую карточку
    for (const card of carCards) {
      try {
        // Получаем текст карточки для извлечения данных
        const cardText = card.textContent?.trim() || '';
        
        // Ищем ссылку на детальную страницу
        const link = card.querySelector('a[href*="/sale/second_hand/"]');
        let detailUrl = '';
        if (link && link instanceof HTMLAnchorElement) {
          detailUrl = link.href;
          
          // Пропускаем, если этот URL уже обработан
          if (processedUrls.has(detailUrl)) continue;
          processedUrls.add(detailUrl);
        }
        
        // Извлекаем данные с помощью регулярных выражений
        const makeModelMatch = cardText.match(/([A-Za-zА-Яа-я]+)\s+([A-Za-zА-Яа-я0-9\s]+(?:I|II|III|IV|V|VI|VII|VIII|IX|X)?(?:\s+Рестайлинг)?(?:\s+\(\d{4}\))?)/);
        const yearMatch = cardText.match(/(\d{4})\s*г/);
        const mileageMatch = cardText.match(/(\d[\d\s]+)\s*км/);
        const engineMatch = cardText.match(/(\d+)\s*см3/);
        const fuelMatch = cardText.match(/(Бензин|Дизель)(?:\s*\/\s*турбо)?/i);
        const transmissionMatch = cardText.match(/(Механика|Автомат|Робот|Вариатор)/i);
        const driveMatch = cardText.match(/(Передний|Задний|Полный)/i);
        const priceMatch = cardText.match(/(\d[\d\s]+)\s*₽/);
        
        // Проверяем, что у нас есть минимально необходимые данные
        if (makeModelMatch && yearMatch && priceMatch) {
          // Очищаем данные от лишних префиксов
          let make = makeModelMatch[1].trim();
          let model = makeModelMatch[2].trim();
          
          // Удаляем префиксы "В наличии" и подобные
          if (make === 'В') {
            const fullText = makeModelMatch[0];
            const cleanedText = fullText.replace('В наличии', '').trim();
            const parts = cleanedText.split(/\s+/);
            if (parts.length >= 2) {
              make = parts[0];
              model = parts.slice(1).join(' ');
            }
          }
          
          const year = parseInt(yearMatch[1], 10);
          
          // Берем последнее совпадение цены (обычно это актуальная цена со скидкой)
          let price = 0;
          const allPrices = cardText.match(/\d[\d\s]+\s*₽/g) || [];
          if (allPrices.length > 0) {
            const lastPrice = allPrices[allPrices.length - 1];
            price = parseInt(lastPrice.replace(/\s|₽/g, ''), 10);
          } else if (priceMatch) {
            price = parseInt(priceMatch[1].replace(/\s/g, ''), 10);
          }
          
          // Создаем уникальный идентификатор для автомобиля
          const carId = `${make}-${model}-${year}-${price}`;
          
          // Пропускаем, если такой автомобиль уже обработан
          if (processedCars.has(carId)) continue;
          processedCars.add(carId);
          
          // Получаем URL изображения - берем первое изображение с классом images-slider-blinds__image
          let imageUrl: string | undefined = undefined;
          const img = card.querySelector('img.images-slider-blinds__image');
          if (img && img instanceof HTMLImageElement && img.src) {
            imageUrl = img.src;
            if (imageUrl && !imageUrl.startsWith('http')) {
              imageUrl = new URL(imageUrl, url).href;
            }
            
            // Проверяем, что это не заглушка no_car.jpg
            if (imageUrl && imageUrl.includes('no_car.jpg')) {
              imageUrl = undefined; // Не используем заглушки
            }
          }
          
          // Создаем объект автомобиля
          const car: RawParsedCar = {
            make,
            model,
            year,
            price,
            mileage: mileageMatch ? parseInt(mileageMatch[1].replace(/\s/g, ''), 10) : undefined,
            engine: engineMatch ? 
              `${fuelMatch ? fuelMatch[1] : ''}, ${engineMatch[1]} см3` : 
              undefined,
            horsePower: undefined, // Не всегда доступно на avtogermes.ru
            color: undefined, // Не всегда доступно на avtogermes.ru
            imageUrl,
            city: 'Москва', // По умолчанию для avtogermes.ru
            bodyType: undefined, // Не всегда доступно на avtogermes.ru
            transmission: transmissionMatch ? transmissionMatch[1] : undefined,
            drive: driveMatch ? driveMatch[1] : undefined,
            url: detailUrl || undefined
          };
          
          // Добавляем автомобиль в список
          cars.push(car);
          console.log(`Добавлен автомобиль: ${car.make} ${car.model}, ${car.year}, ${car.price} ₽, изображение: ${car.imageUrl || 'нет'}`);
        }
      } catch (e: any) {
        console.error(`Ошибка парсинга карточки автомобиля avtogermes.ru: ${e.message}`);
      }
    }

  } catch (error: any) {
    console.error(`Ошибка при парсинге avtogermes.ru: ${error.message}`);
    // Возвращаем пустой массив в случае ошибки
    return [];
  }
  
  // Если парсинг не дал результатов или произошла ошибка на предыдущих этапах,
  // cars будет пустым. Возвращаем его.
  if (cars.length === 0) {
    console.warn("Парсер avtogermes.ru не нашел объявлений или произошла ошибка.");
  } else {
    console.log(`Успешно найдено ${cars.length} уникальных автомобилей на avtogermes.ru`);
  }

  return cars;
}
