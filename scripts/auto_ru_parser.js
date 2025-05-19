/**
 * Скрипт для парсинга данных с auto.ru с использованием Playwright
 * 
 * Использование:
 * node auto_ru_parser.js <url> [--details]
 * 
 * Параметры:
 * url - URL страницы с автомобилями на auto.ru
 * --details - флаг для парсинга детальной информации об автомобиле
 */

const { chromium } = require('playwright');

// Конфигурация
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
const TIMEOUT = 60000; // 60 секунд
const WAIT_FOR_SELECTOR_TIMEOUT = 30000; // 30 секунд

// Получаем аргументы командной строки
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Необходимо указать URL для парсинга');
  process.exit(1);
}

const url = args[0];
const isDetailMode = args.includes('--details');

/**
 * Основная функция парсинга
 */
async function parseAutoRu() {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-site-isolation-trials'
    ]
  });

  try {
    const context = await browser.newContext({
      userAgent: USER_AGENT,
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
      locale: 'ru-RU',
      timezoneId: 'Europe/Moscow',
      permissions: ['geolocation'],
      geolocation: { latitude: 55.7558, longitude: 37.6173 }, // Москва
    });

    // Включаем перехват запросов для блокировки ненужных ресурсов
    await context.route('**/*.{png,jpg,jpeg,gif,svg,woff,woff2,ttf,otf,eot}', route => route.abort());
    await context.route('**/(analytics|tracking|adservice|pagead|doubleclick)/**', route => route.abort());

    const page = await context.newPage();
    
    // Устанавливаем таймаут
    page.setDefaultTimeout(TIMEOUT);
    
    console.log(`Открываем страницу: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Проверяем наличие капчи и пытаемся её обойти
    await handleCaptcha(page);

    // В зависимости от режима парсим список или детали
    if (isDetailMode) {
      const carDetails = await parseCarDetails(page);
      console.log(JSON.stringify(carDetails, null, 2));
    } else {
      const cars = await parseCarsList(page);
      console.log(JSON.stringify(cars, null, 2));
    }

  } catch (error) {
    console.error('Ошибка при парсинге:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

/**
 * Обработка капчи
 */
async function handleCaptcha(page) {
  try {
    // Проверяем наличие капчи
    const hasCaptcha = await page.evaluate(() => {
      return window.location.href.includes('showcaptcha') || 
             document.title.includes('robot') || 
             document.title.includes('captcha');
    });

    if (hasCaptcha) {
      console.error('Обнаружена капча. Пытаемся обойти...');
      
      // Ждем появления чекбокса капчи
      await page.waitForSelector('input[type="checkbox"]', { timeout: WAIT_FOR_SELECTOR_TIMEOUT });
      
      // Кликаем на чекбокс
      await page.click('input[type="checkbox"]');
      
      // Ждем редиректа после успешного прохождения капчи
      await page.waitForNavigation({ timeout: WAIT_FOR_SELECTOR_TIMEOUT });
      
      // Проверяем, что капча пройдена
      const stillHasCaptcha = await page.evaluate(() => {
        return window.location.href.includes('showcaptcha') || 
               document.title.includes('robot') || 
               document.title.includes('captcha');
      });
      
      if (stillHasCaptcha) {
        throw new Error('Не удалось обойти капчу автоматически');
      }
      
      console.log('Капча успешно пройдена');
    }
  } catch (error) {
    console.error('Ошибка при обработке капчи:', error);
    throw new Error('Не удалось обойти защиту от ботов');
  }
}

/**
 * Парсинг списка автомобилей
 */
async function parseCarsList(page) {
  try {
    // Ждем загрузки списка автомобилей
    await page.waitForSelector('.ListingItem', { timeout: WAIT_FOR_SELECTOR_TIMEOUT });
    
    // Прокручиваем страницу, чтобы загрузить больше автомобилей
    await autoScroll(page);
    
    // Извлекаем данные об автомобилях
    const cars = await page.evaluate(() => {
      const carItems = Array.from(document.querySelectorAll('.ListingItem'));
      return carItems.map(item => {
        // Извлекаем основные данные
        const titleElement = item.querySelector('.ListingItem__title');
        const title = titleElement ? titleElement.textContent.trim() : '';
        
        // Разбиваем заголовок на марку и модель
        const titleParts = title.split(' ');
        const make = titleParts[0] || '';
        const model = titleParts.slice(1).join(' ') || '';
        
        // Извлекаем год
        const yearElement = item.querySelector('.ListingItem__year');
        const yearText = yearElement ? yearElement.textContent.trim() : '';
        const yearMatch = yearText.match(/(\d{4})/);
        const year = yearMatch ? parseInt(yearMatch[1], 10) : 0;
        
        // Извлекаем цену
        const priceElement = item.querySelector('.ListingItemPrice__content');
        const priceText = priceElement ? priceElement.textContent.trim() : '';
        const priceMatch = priceText.match(/(\d[\d\s]+)/);
        const price = priceMatch ? parseInt(priceMatch[1].replace(/\s/g, ''), 10) : 0;
        
        // Извлекаем пробег
        const kmElement = item.querySelector('.ListingItem__kmAge');
        const kmText = kmElement ? kmElement.textContent.trim() : '';
        const kmMatch = kmText.match(/(\d[\d\s]+)/);
        const mileage = kmMatch ? parseInt(kmMatch[1].replace(/\s/g, ''), 10) : 0;
        
        // Извлекаем технические характеристики
        const techElement = item.querySelector('.ListingItem__techSummary');
        const techText = techElement ? techElement.textContent.trim() : '';
        
        // Извлекаем тип двигателя и объем
        let engine = '';
        let horsePower = 0;
        const engineMatch = techText.match(/(Бензин|Дизель|Электро|Гибрид)[\s,]+([\d.,]+)\s*л/i);
        if (engineMatch) {
          const fuelType = engineMatch[1];
          const volume = engineMatch[2].replace(',', '.');
          engine = `${fuelType}, ${volume} л`;
          
          // Извлекаем мощность
          const hpMatch = techText.match(/(\d+)\s*л\.с\./);
          if (hpMatch) {
            horsePower = parseInt(hpMatch[1], 10);
          }
        }
        
        // Извлекаем тип трансмиссии
        let transmission = '';
        if (techText.includes('механика') || techText.includes('МКПП')) {
          transmission = 'Механика';
        } else if (techText.includes('автомат') || techText.includes('АКПП')) {
          transmission = 'Автомат';
        } else if (techText.includes('робот')) {
          transmission = 'Робот';
        } else if (techText.includes('вариатор') || techText.includes('CVT')) {
          transmission = 'Вариатор';
        }
        
        // Извлекаем тип привода
        let drive = '';
        if (techText.includes('передний привод') || techText.includes('FWD')) {
          drive = 'Передний';
        } else if (techText.includes('задний привод') || techText.includes('RWD')) {
          drive = 'Задний';
        } else if (techText.includes('полный привод') || techText.includes('4WD') || techText.includes('AWD')) {
          drive = 'Полный';
        }
        
        // Извлекаем URL изображения
        let imageUrl = '';
        const imgElement = item.querySelector('.ListingItem__image img');
        if (imgElement && imgElement.src) {
          imageUrl = imgElement.src;
        }
        
        // Извлекаем URL детальной страницы
        let url = '';
        const linkElement = item.querySelector('.ListingItemTitle__link');
        if (linkElement && linkElement.href) {
          url = linkElement.href;
        }
        
        // Извлекаем город
        let city = '';
        const locationElement = item.querySelector('.ListingItem__geoInfo');
        if (locationElement) {
          city = locationElement.textContent.trim();
        }
        
        // Извлекаем тип кузова
        let bodyType = '';
        const bodyTypeMatch = techText.match(/(седан|хэтчбек|универсал|внедорожник|кроссовер|купе|кабриолет|минивэн|пикап|фургон)/i);
        if (bodyTypeMatch) {
          bodyType = bodyTypeMatch[1].charAt(0).toUpperCase() + bodyTypeMatch[1].slice(1).toLowerCase();
        }
        
        // Извлекаем цвет
        let color = '';
        const colorElement = item.querySelector('.ListingItem__color');
        if (colorElement) {
          color = colorElement.textContent.trim();
        }
        
        return {
          make,
          model,
          year,
          price,
          mileage,
          engine,
          horsePower,
          color,
          imageUrl,
          city,
          bodyType,
          transmission,
          drive,
          url
        };
      });
    });
    
    return cars;
  } catch (error) {
    console.error('Ошибка при парсинге списка автомобилей:', error);
    throw error;
  }
}

/**
 * Парсинг детальной информации об автомобиле
 */
async function parseCarDetails(page) {
  try {
    // Ждем загрузки детальной страницы
    await page.waitForSelector('.CardHead', { timeout: WAIT_FOR_SELECTOR_TIMEOUT });
    
    // Извлекаем детальные данные об автомобиле
    const carDetails = await page.evaluate(() => {
      // Извлекаем заголовок (марка и модель)
      const titleElement = document.querySelector('.CardHead__title');
      const title = titleElement ? titleElement.textContent.trim() : '';
      
      // Разбиваем заголовок на марку и модель
      const titleParts = title.split(' ');
      const make = titleParts[0] || '';
      const model = titleParts.slice(1).join(' ') || '';
      
      // Извлекаем год
      const yearElement = document.querySelector('.CardHead__year');
      const yearText = yearElement ? yearElement.textContent.trim() : '';
      const yearMatch = yearText.match(/(\d{4})/);
      const year = yearMatch ? parseInt(yearMatch[1], 10) : 0;
      
      // Извлекаем цену
      const priceElement = document.querySelector('.OfferPriceCaption__price');
      const priceText = priceElement ? priceElement.textContent.trim() : '';
      const priceMatch = priceText.match(/(\d[\d\s]+)/);
      const price = priceMatch ? parseInt(priceMatch[1].replace(/\s/g, ''), 10) : 0;
      
      // Извлекаем пробег
      const kmElement = document.querySelector('.CardInfoRow_kmAge');
      const kmText = kmElement ? kmElement.textContent.trim() : '';
      const kmMatch = kmText.match(/(\d[\d\s]+)/);
      const mileage = kmMatch ? parseInt(kmMatch[1].replace(/\s/g, ''), 10) : 0;
      
      // Извлекаем технические характеристики
      const techElements = document.querySelectorAll('.CardInfoRow');
      let engine = '';
      let horsePower = 0;
      let transmission = '';
      let drive = '';
      let bodyType = '';
      let color = '';
      let city = '';
      
      techElements.forEach(element => {
        const label = element.querySelector('.CardInfoRow__label');
        const value = element.querySelector('.CardInfoRow__value');
        
        if (label && value) {
          const labelText = label.textContent.trim().toLowerCase();
          const valueText = value.textContent.trim();
          
          if (labelText.includes('двигатель')) {
            engine = valueText;
            const hpMatch = valueText.match(/(\d+)\s*л\.с\./);
            if (hpMatch) {
              horsePower = parseInt(hpMatch[1], 10);
            }
          } else if (labelText.includes('коробка')) {
            transmission = valueText;
          } else if (labelText.includes('привод')) {
            drive = valueText;
          } else if (labelText.includes('кузов')) {
            bodyType = valueText;
          } else if (labelText.includes('цвет')) {
            color = valueText;
          } else if (labelText.includes('город')) {
            city = valueText;
          }
        }
      });
      
      // Извлекаем URL изображений
      const imageElements = document.querySelectorAll('.ImageGalleryDesktop__image img');
      const images = Array.from(imageElements).map(img => img.src).filter(Boolean);
      const imageUrl = images.length > 0 ? images[0] : '';
      
      // Извлекаем описание
      const descriptionElement = document.querySelector('.CardDescription__text');
      const description = descriptionElement ? descriptionElement.textContent.trim() : '';
      
      // Извлекаем комплектацию
      const equipmentElements = document.querySelectorAll('.CardFeatures__item');
      const equipment = Array.from(equipmentElements)
        .map(item => item.textContent.trim())
        .filter(Boolean);
      
      // Извлекаем безопасность
      const safetyElements = document.querySelectorAll('.CardFeatures__group:has(.CardFeatures__groupTitle:contains("Безопасность")) .CardFeatures__item');
      const safetyFeatures = Array.from(safetyElements)
        .map(item => item.textContent.trim())
        .filter(Boolean);
      
      return {
        make,
        model,
        year,
        price,
        mileage,
        engine,
        horsePower,
        color,
        imageUrl,
        city,
        bodyType,
        transmission,
        drive,
        url: window.location.href,
        description,
        equipment,
        safetyFeatures,
        images
      };
    });
    
    return carDetails;
  } catch (error) {
    console.error('Ошибка при парсинге детальной информации об автомобиле:', error);
    throw error;
  }
}

/**
 * Автоматическая прокрутка страницы для загрузки всех элементов
 */
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

// Запускаем парсинг
parseAutoRu().catch(error => {
  console.error('Критическая ошибка:', error);
  process.exit(1);
});
