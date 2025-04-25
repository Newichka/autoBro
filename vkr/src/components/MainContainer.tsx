import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Filter from './Filter';

// Типы данных для CarDTO и интерфейсы
interface Car {
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
}

interface BodyType {
  id: number;
  name: string;
}

interface Color {
  id: number;
  name: string;
  hexCode: string;
}

interface ApiResponse<T> {
  data: T;
  message: string;
  status: string;
  timestamp: string;
}

// Фильтр для поиска автомобилей
interface CarFilter {
  make?: string[];
  model?: string[];
  minYear?: number;
  maxYear?: number;
  minPrice?: number;
  maxPrice?: number;
  minMileage?: number; // Добавляю поле минимального пробега
  maxMileage?: number;
  bodyTypeId?: number[];
  fuelType?: string[];
  minHorsePower?: number;
  transmissionType?: string[];
  driveType?: string[];
  colorId?: number[];
  country?: string;
  city?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: string;
}

const MainContainer: React.FC = () => {
  // Определяем базовый URL для API
  const API_URL = '';  // пустая строка означает, что запросы будут отправлены на тот же домен
  
  // Основные данные
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 0, totalPages: 0, totalElements: 0 });
  
  // Справочники
  const [bodyTypes, setBodyTypes] = useState<BodyType[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [fuelTypes, setFuelTypes] = useState<string[]>([]);
  const [transmissionTypes, setTransmissionTypes] = useState<string[]>([]);
  const [driveTypes, setDriveTypes] = useState<string[]>([]);
  
  // Состояние для модального окна
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  
  // Состояние для кнопки "Наверх"
  const [showScrollButton, setShowScrollButton] = useState<boolean>(false);
  
  // Опции отображения
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  // Состояние для выпадающего меню сортировки
  const [showSortDropdown, setShowSortDropdown] = useState<boolean>(false);
  const sortDropdownRef = React.useRef<HTMLDivElement>(null);
  
  // Отслеживание клика вне выпадающего меню для его закрытия
  useEffect(() => {
    const handleClickOutside = (event: PointerEvent) => {
      if (showSortDropdown && sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [showSortDropdown]);
  
  // Функция для применения параметров сортировки
  const applySorting = (sortBy: string, sortDirection: string) => {
    setFilters({...filters, sortBy, sortDirection});
    setShowSortDropdown(false);
    setTimeout(() => fetchCars(), 0);
  };
  
  // Фильтры
  const [filters, setFilters] = useState<CarFilter>({
    page: 0,
    size: 10,
    sortDirection: 'DESC',
    sortBy: 'createdAt',
    make: [],
    model: [],
    bodyTypeId: [],
    fuelType: [],
    transmissionType: [],
    driveType: [],
    colorId: [],
    minMileage: undefined,
    maxMileage: undefined,
    minPrice: undefined,
    maxPrice: undefined,
    minYear: undefined,
    maxYear: undefined,
    minHorsePower: undefined
  });
  const [selectedMake, setSelectedMake] = useState<string>('');

  // Добавляю состояние для текущей фотографии в галерее
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number>(0);
  
  // Загрузка справочников при инициализации
  useEffect(() => {
    const fetchDictionaries = async () => {
      try {
        console.log('Загрузка справочников...');
        const [
          bodyTypesRes, 
          colorsRes, 
          makesRes, 
          fuelTypesRes, 
          transmissionTypesRes,
          driveTypesRes
        ] = await Promise.all([
          axios.get<ApiResponse<BodyType[]>>('/dictionary/body-types'),
          axios.get<ApiResponse<Color[]>>('/dictionary/colors'),
          axios.get<ApiResponse<string[]>>('/cars/makes'),
          axios.get<ApiResponse<string[]>>('/dictionary/fuel-types'),
          axios.get<ApiResponse<string[]>>('/dictionary/transmission-types'),
          axios.get<ApiResponse<string[]>>('/dictionary/drive-types')
        ]);
        
        console.log('Получены данные о марках (сырые):', makesRes);
        
        // Обработка данных на случай циклических ссылок
        const processBodyTypes = (data: any[]): BodyType[] => {
          if (!data || !Array.isArray(data)) return [];
          return data.map(item => ({
            id: item.id || 0,
            name: item.name || 'Неизвестно'
          }));
        };
        
        const processColors = (data: any[]): Color[] => {
          if (!data || !Array.isArray(data)) return [];
          return data.map(item => ({
            id: item.id || 0,
            name: item.name || 'Неизвестно',
            hexCode: item.hexCode || '#000000'
          }));
        };
        
        const processStringArray = (inputData: any): string[] => {
          console.log('Обрабатываю данные типа:', typeof inputData, inputData);
          
          // Если inputData вообще не определен, возвращаем пустой массив
          if (inputData === undefined || inputData === null) {
            console.log('Входные данные пусты или не определены');
            return [];
          }
          
          // Если inputData является объектом с data полем
          if (typeof inputData === 'object' && !Array.isArray(inputData)) {
            console.log('Входные данные - объект, проверяем наличие поля data');
            
            // Проверяем разные возможные места расположения данных
            if ('data' in inputData && Array.isArray(inputData.data)) {
              console.log('Извлекаем массив из объекта data:', inputData.data);
              inputData = inputData.data;
            } else if ('content' in inputData && Array.isArray(inputData.content)) {
              console.log('Извлекаем массив из объекта content:', inputData.content);
              inputData = inputData.content;
            } else {
              for (const key in inputData) {
                if (Array.isArray(inputData[key])) {
                  console.log(`Извлекаем массив из объекта по ключу ${key}:`, inputData[key]);
                  inputData = inputData[key];
                  break;
                }
              }
            }
            
            // Если после всех проверок inputData не стал массивом
            if (!Array.isArray(inputData)) {
              console.log('Не удалось найти массив в объекте:', inputData);
              return [];
            }
          }
          
          // Если inputData не массив (например, строка), преобразуем в массив
          if (!Array.isArray(inputData)) {
            console.log('Преобразуем не-массив в массив:', inputData);
            try {
              // Если это JSON-строка, пробуем распарсить
              if (typeof inputData === 'string' && (inputData.startsWith('[') || inputData.startsWith('{'))) {
                inputData = JSON.parse(inputData);
                if (!Array.isArray(inputData)) {
                  inputData = [inputData];
                }
              } else {
                inputData = [inputData];
              }
            } catch (e) {
              console.log('Ошибка при парсинге JSON:', e);
              inputData = [inputData];
            }
          }
          
          console.log('Обрабатываю массив данных:', inputData);
          
          // Фильтруем пустые значения и преобразуем данные
          return inputData
            .filter((item: any) => {
              // Отфильтровываем полностью пустые объекты или строки
              if (item === null || item === undefined) return false;
              
              if (typeof item === 'string') {
                return item.trim().length > 0;
              }
              
              if (typeof item === 'object') {
                // Для объектов с id и name
                if ('id' in item && 'name' in item) {
                  return item.name && typeof item.name === 'string' && item.name.trim().length > 0;
                }
                
                // Для других объектов проверяем наличие хотя бы одного непустого строкового поля
                return Object.values(item).some(value => 
                  typeof value === 'string' && value.trim().length > 0
                );
              }
              
              return true; // Все остальные значения оставляем
            })
            .map((item: any) => {
              // Если это простая строка, возвращаем как есть
              if (typeof item === 'string') {
                return item;
              } 
              // Если это объект с id и name (как в случае с марками)
              else if (item && typeof item === 'object') {
                console.log('Обрабатываю объект:', item);
                
                // Обработка объектов формата {id: number, name: string}
                if ('id' in item && 'name' in item) {
                  return item.name || 'Неизвестно';
                }
                // Обработка других объектов с именем
                else if ('name' in item) {
                  return item.name as string;
                } 
                // Обработка объектов со значением
                else if ('value' in item) {
                  return item.value as string;
                } 
                // Обработка объектов с маркой
                else if ('make' in item) {
                  return typeof item.make === 'string' ? item.make : 'Неизвестно';
                } 
                // Если ничего не подошло, преобразуем объект в строку
                else {
                  console.log('Неизвестный формат объекта:', item);
                  // Пытаемся найти какое-либо текстовое поле
                  const firstTextProperty = Object.entries(item)
                    .find(([_, value]) => typeof value === 'string' && value.length > 0);
                  
                  if (firstTextProperty) {
                    return firstTextProperty[1];
                  }
                  
                  return 'Неизвестно';
                }
              } 
              // Если это не строка и не объект, преобразуем в строку
              else {
                return String(item || 'Неизвестно');
              }
            });
        };
        
        // Получаем данные из ответа API
        const bodyTypesData = bodyTypesRes.data?.data || [];
        const colorsData = colorsRes.data?.data || [];
        
        // Преобразуем данные о марках
        let makesData: string[] | any = makesRes.data;
        
        // Если makesData - объект с data полем
        if (makesData && typeof makesData === 'object' && 'data' in makesData) {
          makesData = makesData.data;
        }
        
        console.log('Обрабатываемые данные марок:', makesData);
        
        // Если makesData все еще не массив или пустой массив
        if (!Array.isArray(makesData) || makesData.length === 0) {
          console.log('makesData не массив или пуст, устанавливаем дефолтные значения');
          makesData = ["Toyota", "BMW", "Mercedes-Benz", "Audi", "Volkswagen", "Honda", "Lexus", "Ford", "Hyundai", "Kia"];
        }
        
        // Безопасно извлекаем данные из ответа API для других справочников
        let fuelTypesData: string[] | any = fuelTypesRes.data?.data || [];
        let transmissionTypesData: string[] | any = transmissionTypesRes.data?.data || [];
        let driveTypesData: string[] | any = driveTypesRes.data?.data || [];
        
        console.log('Обработка марок:', makesData);
        
        // Устанавливаем обработанные данные
        setBodyTypes(processBodyTypes(bodyTypesData));
        setColors(processColors(colorsData));
        
        const processedMakes = processStringArray(makesData);
        console.log('Обработанные марки:', processedMakes);
        setMakes(processedMakes.length > 0 ? processedMakes : ["Toyota", "BMW", "Mercedes-Benz", "Audi", "Volkswagen"]);
        
        setFuelTypes(processStringArray(fuelTypesData).length > 0 ? 
          processStringArray(fuelTypesData) : 
          ["Бензин", "Дизель", "Гибрид", "Электро"]
        );
        
        setTransmissionTypes(processStringArray(transmissionTypesData).length > 0 ? 
          processStringArray(transmissionTypesData) : 
          ["Автоматическая", "Механическая", "Вариатор", "Робот"]
        );
        
        setDriveTypes(processStringArray(driveTypesData).length > 0 ? 
          processStringArray(driveTypesData) : 
          ["Передний", "Задний", "Полный"]
        );
      } catch (err) {
        console.error('Ошибка при загрузке справочников:', err);
        setError('Не удалось загрузить справочные данные');
        // Устанавливаем значения по умолчанию
        setBodyTypes([
          { id: 1, name: "Седан" },
          { id: 2, name: "Хэтчбек" },
          { id: 3, name: "Универсал" },
          { id: 4, name: "Внедорожник" },
          { id: 5, name: "Кроссовер" }
        ]);
        setColors([
          { id: 1, name: "Черный", hexCode: "#000000" },
          { id: 2, name: "Белый", hexCode: "#FFFFFF" },
          { id: 3, name: "Серый", hexCode: "#808080" },
          { id: 4, name: "Красный", hexCode: "#FF0000" },
          { id: 5, name: "Синий", hexCode: "#0000FF" }
        ]);
        setMakes(["Toyota", "BMW", "Mercedes-Benz", "Audi", "Volkswagen", "Honda", "Lexus", "Ford", "Hyundai", "Kia"]);
        setFuelTypes(["Бензин", "Дизель", "Гибрид", "Электро"]);
        setTransmissionTypes(["Автоматическая", "Механическая", "Вариатор", "Робот"]);
        setDriveTypes(["Передний", "Задний", "Полный"]);
      }
    };
    
    fetchDictionaries();
  }, []);
  
  // Эффект для загрузки моделей при изменении выбранных марок
  useEffect(() => {
    if (filters.make && Array.isArray(filters.make) && filters.make.length > 0) {
      // Логика загрузки моделей для всех выбранных марок
      const fetchModelsForAllMakes = async () => {
        try {
          const selectedMakes = filters.make as string[];
          
          // Если выбрана только одна марка, выполняем стандартный запрос
          if (selectedMakes.length === 1) {
            const response = await axios.get(`/cars/models`, {
              params: {
                makes: selectedMakes[0]
              }
            });
            
            if (response.data && response.data.success) {
              // Устанавливаем полученные модели
              setModels(processModels(response.data.data));
            } else {
              throw new Error('Ошибка получения моделей');
            }
          } 
          // Если выбрано несколько марок, делаем отдельные запросы для каждой марки
          else {
            setLoading(true);
            console.log("Загрузка моделей для марок:", selectedMakes);
            
            try {
              // Делаем запрос к эндпоинту, который поддерживает несколько марок
              const response = await axios.post(`/cars/models/by-makes`, {
                makes: selectedMakes
              });
              
              if (response.data && response.data.success) {
                setModels(processModels(response.data.data));
                console.log("Загружены модели:", response.data.data);
              } else {
                console.warn("API вернул ошибку при загрузке моделей");
                
                // Запасной вариант: загружаем модели по одной марке
                
                // Параллельные запросы для каждой марки
                const promises = selectedMakes.map(make => 
                  axios.get(`/cars/models`, { params: { makes: make } })
                    .then(resp => {
                      if (resp.data && resp.data.success) {
                        return processModels(resp.data.data);
                      }
                      return [];
                    })
                    .catch(err => {
                      console.error(`Ошибка загрузки моделей для марки ${make}:`, err);
                      return [];
                    })
                );
                
                // Дожидаемся выполнения всех запросов
                const results = await Promise.all(promises);
                
                // Собираем все модели вместе и убираем дубликаты
                const combinedModels = results.flat();
                const uniqueModels = [...new Set(combinedModels)].sort();
                
                setModels(uniqueModels);
                console.log("Загружены модели запасным методом:", uniqueModels);
              }
            } catch (err) {
              console.error("Ошибка при загрузке моделей:", err);
              setModels(['Ошибка загрузки моделей']);
            } finally {
              setLoading(false);
            }
          }
        } catch (err) {
          console.error("Ошибка при загрузке моделей:", err);
          
          // Устанавливаем стандартные значения для популярных брендов в случае ошибки
          const makeList = Array.isArray(filters.make) ? filters.make : [];
          if (makeList.includes('Toyota')) {
            setModels(['Camry', 'Corolla', 'RAV4', 'Land Cruiser', 'Highlander']);
          } else if (makeList.includes('BMW')) {
            setModels(['3 Series', '5 Series', 'X3', 'X5', 'X7']);
          } else if (makeList.includes('Mercedes-Benz')) {
            setModels(['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE']);
          } else {
            setModels(['Модель 1', 'Модель 2', 'Модель 3']);
          }
        }
      };
      
      // Функция для обработки данных моделей
      const processModels = (data: any[]): string[] => {
        if (!Array.isArray(data)) return [];
        return data.map(item => typeof item === 'string' ? item : (item?.name || String(item) || 'Неизвестно'))
          .filter(Boolean)
          .sort();
      };
      
      fetchModelsForAllMakes();
    } else {
      setModels([]);
    }
  }, [filters.make]);
  
  // Функция для отладки параметров перед отправкой
  const validateEnumValues = (params: Record<string, any>) => {
    // Проверим значения перечислений и выведем предупреждения, если они не соответствуют ожидаемым
    
    // Ожидаемые значения для driveType
    const validDriveTypes = ['FRONT_WHEEL', 'REAR_WHEEL', 'ALL_WHEEL', 'PART_TIME_4WD'];
    if (params.driveType && Array.isArray(params.driveType)) {
      params.driveType.forEach((value: string) => {
        if (!validDriveTypes.includes(value)) {
          console.warn(`Внимание: Передаётся неизвестное значение для типа привода: ${value}`);
        }
      });
    }
    
    // Ожидаемые значения для transmissionType
    const validTransmissionTypes = ['AUTOMATIC', 'MANUAL', 'CVT', 'ROBOT'];
    if (params.transmissionType && Array.isArray(params.transmissionType)) {
      params.transmissionType.forEach((value: string) => {
        if (!validTransmissionTypes.includes(value)) {
          console.warn(`Внимание: Передаётся неизвестное значение для типа трансмиссии: ${value}`);
        }
      });
    }
    
    // Ожидаемые значения для fuelType
    const validFuelTypes = ['PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC'];
    if (params.fuelType && Array.isArray(params.fuelType)) {
      params.fuelType.forEach((value: string) => {
        if (!validFuelTypes.includes(value)) {
          console.warn(`Внимание: Передаётся неизвестное значение для типа топлива: ${value}`);
        }
      });
    }
    
    return params;
  };

  // Загрузка автомобилей с применением фильтров
  const fetchCars = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Подготовка параметров для запроса
      // Преобразуем массивы в формат, который ожидает бэкенд
      const params: Record<string, any> = {};
      
      // Копируем все фильтры, кроме массивов
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof CarFilter];
        // Если это массив и он не пустой, добавляем его напрямую
        if (Array.isArray(value) && value.length > 0) {
          params[key] = value;
        } 
        // Если значение определено и не является пустым массивом
        else if (value !== undefined && (!Array.isArray(value) || value.length > 0)) {
          params[key] = value;
        }
      });
      
      console.log('Sending request with params:', params);
      
      // Валидация параметров-перечислений - просто выводим значения для отладки
      console.log('driveType:', params.driveType);
      console.log('transmissionType:', params.transmissionType);
      console.log('fuelType:', params.fuelType);
      
      // Построим URL для логирования
      const logUrl = '/cars?' + Object.keys(params)
        .map(key => {
          const value = params[key];
          if (Array.isArray(value)) {
            return value.map(v => `${key}=${encodeURIComponent(v)}`).join('&');
          }
          return `${key}=${encodeURIComponent(value)}`;
        })
        .join('&');
      
      console.log('URL для запроса (после преобразования):', logUrl);
      
      const response = await axios.get<any>('/cars', {
        params: params,
        paramsSerializer: (params) => {
          // Определяем формат для каждого типа параметра
          // DriveType и подобные параметры должны отправляться без объединения в одну строку
          return Object.keys(params)
            .map(key => {
              const value = params[key];
              if (Array.isArray(value)) {
                if (value.length === 0) {
                  return '';
                }
                
                // Особая обработка для перечислений (enum) на бэкенде
                // Для driveType, transmissionType и других подобных параметров
                if (['driveType', 'transmissionType', 'fuelType'].includes(key)) {
                  // Отправляем каждое значение отдельно, без объединения
                  return value.map(v => `${encodeURIComponent(key)}=${encodeURIComponent(v)}`).join('&');
                } else {
                  // Для других массивов используем repeat формат
                  return value.map(v => `${encodeURIComponent(key)}=${encodeURIComponent(v)}`).join('&');
                }
              }
              return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
            })
            .filter(part => part !== '')
            .join('&');
        }
      });
      
      console.log('API Response status:', response.status);
      console.log('API Response headers:', response.headers);
      console.log('API Response data:', response.data);
      
      // Обработка данных авто для предотвращения проблем с циклическими ссылками
      const processCars = (cars: any[]): Car[] => {
        if (!cars || !Array.isArray(cars)) return [];
        
        return cars.map(car => {
          // Получаем основное фото
          const mainPhotoUrl = car.mainPhotoUrl || 'https://via.placeholder.com/300x200?text=Нет+фото';
          
          // Формируем массив фотографий, убеждаясь, что основное фото включено
          let allPhotos: string[] = [];
          if (Array.isArray(car.allPhotoUrls) && car.allPhotoUrls.length > 0) {
            allPhotos = car.allPhotoUrls;
            // Проверяем, есть ли основное фото в массиве всех фото
            if (mainPhotoUrl && !allPhotos.includes(mainPhotoUrl)) {
              // Если основного фото нет в массиве, добавляем его в начало
              allPhotos = [mainPhotoUrl, ...allPhotos];
            }
          } else if (mainPhotoUrl) {
            // Если массив фото пуст, но есть основное фото, добавляем его
            allPhotos = [mainPhotoUrl];
          }
          
          // Базовый объект с дефолтными значениями
          const normalizedCar: Car = {
            id: car.id || 0,
            make: typeof car.make === 'object' ? car.make.name : car.make || 'Неизвестно',
            model: typeof car.model === 'object' ? car.model.name : car.model || 'Неизвестно',
            year: car.year || new Date().getFullYear(),
            bodyTypeName: car.bodyTypeName || (car.bodyType ? (typeof car.bodyType === 'object' ? car.bodyType.name : String(car.bodyType)) : 'Неизвестно'),
            price: car.price || 0,
            mileage: car.mileage || 0,
            engineInfo: car.engineInfo || (car.engine ? (typeof car.engine === 'object' ? car.engine.name : String(car.engine)) : 'Неизвестно'),
            transmissionInfo: car.transmissionInfo || (car.transmission ? (typeof car.transmission === 'object' ? car.transmission.name : String(car.transmission)) : 'Неизвестно'),
            colorName: car.colorName || (car.color ? (typeof car.color === 'object' ? car.color.name : String(car.color)) : 'Неизвестно'),
            condition: car.condition ? (typeof car.condition === 'object' ? car.condition.name : String(car.condition)) : 'Неизвестно',
            location: car.location || 'Неизвестно',
            mainPhotoUrl: mainPhotoUrl,
            allPhotoUrls: allPhotos,
            safetyFeatures: Array.isArray(car.safetyFeatures) ? car.safetyFeatures : [],
            equipment: Array.isArray(car.equipment) ? car.equipment : [],
            technicalSpec: {
              fuelType: car.technicalSpec?.fuelType || 'Неизвестно',
              engineVolume: car.technicalSpec?.engineVolume || 0,
              horsePower: car.technicalSpec?.horsePower || 0,
              driveType: car.technicalSpec?.driveType || 'Неизвестно',
              transmissionType: car.technicalSpec?.transmissionType || 'Неизвестно',
              gears: car.technicalSpec?.gears || 0
            },
            createdAt: car.createdAt || new Date().toISOString(),
            updatedAt: car.updatedAt || new Date().toISOString()
          };
          
          return normalizedCar;
        });
      };
      
      // Адаптируем разные форматы ответа от API
      let carsData = [];
      let paginationData = {
        page: 0,
        totalPages: 0,
        totalElements: 0
      };
      
      if (response.data) {
        console.log('Структура ответа:', {
          success: response.data.success,
          isArray: Array.isArray(response.data.data),
          hasData: !!response.data.data,
          pageInfo: response.data.pageInfo
        });
        
        // Прямой массив данных
        if (Array.isArray(response.data)) {
          console.log('API вернул массив напрямую');
          carsData = response.data;
        }
        // Формат Spring: { success: true, data: [...], pageInfo: {...} }
        else if (response.data.success === true && response.data.data) {
          console.log('API вернул объект в формате Spring');
          // Если data - массив объектов, используем его напрямую
          if (Array.isArray(response.data.data)) {
            carsData = response.data.data;
          } 
          // Если data - массив в виде объекта с полем content, используем content
          else if (response.data.data.content && Array.isArray(response.data.data.content)) {
            carsData = response.data.data.content;
          }
          // Если data - объект с полем items, используем items
          else if (response.data.data.items && Array.isArray(response.data.data.items)) {
            carsData = response.data.data.items;
          }
          // Если data - один объект, создаем массив из него
          else if (typeof response.data.data === 'object' && !Array.isArray(response.data.data)) {
            carsData = [response.data.data];
          }
        }
        // Другие возможные форматы
        else if (response.data.items && Array.isArray(response.data.items)) {
          console.log('API вернул объект с полем items');
          carsData = response.data.items;
        }
        else if (response.data.results && Array.isArray(response.data.results)) {
          console.log('API вернул объект с полем results');
          carsData = response.data.results;
        }
        else if (response.data.content && Array.isArray(response.data.content)) {
          console.log('API вернул объект с полем content');
          carsData = response.data.content;
        }
        else if (response.data.cars && Array.isArray(response.data.cars)) {
          console.log('API вернул объект с полем cars');
          carsData = response.data.cars;
        }
        else {
          console.log('Не удалось извлечь данные автомобилей из ответа API:', response.data);
          carsData = [];
        }
        
        // Обрабатываем данные пагинации
        if (response.data.pageInfo) {
          paginationData = {
            page: response.data.pageInfo.pageNumber || 0,
            totalPages: response.data.pageInfo.totalPages || 1,
            totalElements: response.data.pageInfo.totalElements || carsData.length
          };
        } else if (response.data.data && response.data.data.totalPages) {
          // Если пагинация внутри data
          paginationData = {
            page: response.data.data.number || 0,
            totalPages: response.data.data.totalPages || 1,
            totalElements: response.data.data.totalElements || carsData.length
          };
        } else if (response.data.pagination) {
          // Другой формат пагинации
          paginationData = {
            page: response.data.pagination.page || 0,
            totalPages: response.data.pagination.totalPages || 1,
            totalElements: response.data.pagination.totalElements || carsData.length
          };
        } else {
          // Если нет информации о пагинации, создаем базовую
          paginationData = {
            page: 0,
            totalPages: 1,
            totalElements: carsData.length
          };
        }
      }
      
      console.log('Извлеченные данные:', { carsData, paginationData });
      const normalizedCars = processCars(carsData);
      console.log('Нормализованные автомобили:', normalizedCars);
      
      setCars(normalizedCars);
      setPagination(paginationData);
      setLoading(false);
      
      // Добавим запись в консоль о количестве найденных автомобилей
      console.log(`Найдено ${normalizedCars.length} автомобилей`);
    } catch (err) {
      console.error('Ошибка при загрузке автомобилей:', err);
      
      // Более детальная обработка ошибок
      if (axios.isAxiosError(err) && err.response) {
        const errorMessage = err.response.data?.message || err.message;
        const errorDetails = err.response.data?.error || '';
        setError(`Ошибка загрузки данных: ${errorMessage}. ${errorDetails}`);
      } else {
        setError('Не удалось загрузить данные об автомобилях');
      }
      
      setLoading(false);
      
      // Устанавливаем тестовые данные при ошибке
      const defaultCars: Car[] = [
        {
          id: 1,
          make: "Toyota",
          model: "Camry",
          year: 2023,
          bodyTypeName: "Седан",
          price: 2500000,
          mileage: 0,
          engineInfo: "Бензин 2.5L 200HP",
          transmissionInfo: "Автоматическая",
          colorName: "Черный",
          condition: "Новый",
          location: "Москва, Россия",
          mainPhotoUrl: "https://via.placeholder.com/300x200?text=Toyota+Camry",
          allPhotoUrls: [],
          safetyFeatures: ["ABS", "ESP", "Подушки безопасности"],
          equipment: ["Климат-контроль", "Круиз-контроль", "Кожаный салон"],
          technicalSpec: {
            fuelType: "Бензин",
            engineVolume: 2.5,
            horsePower: 200,
            driveType: "Передний",
            transmissionType: "Автоматическая",
            gears: 8
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      setCars(defaultCars);
    }
  };
  
  // Начальная загрузка автомобилей
  useEffect(() => {
    fetchCars();
  }, []);
  
  // Обработчик изменения фильтров
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    let parsedValue: string | number | undefined = value;
    
    // Преобразование числовых значений
    if (['minYear', 'maxYear', 'minPrice', 'maxPrice', 'minMileage', 'maxMileage', 'minHorsePower', 'page', 'size'].includes(name)) {
      // Преобразуем в число или undefined если пустое значение
      parsedValue = value === '' ? undefined : Math.max(0, Number(value));
    }
    
    if (name === 'make') {
      setSelectedMake(value as string);
      // Сбрасываем модель при выборе новой марки
      setFilters(prev => ({ 
        ...prev, 
        make: value ? [value] : [], 
        model: [] 
      }));
    } else {
      setFilters(prev => ({ ...prev, [name]: parsedValue }));
    }
  };
  
  // Обработчик прямого изменения фильтров (для мультивыбора)
  const handleDirectFilterChange = (name: string, value: any) => {
    if (name === 'make') {
      // Если меняется марка, сбрасываем выбранные модели
      setFilters(prev => ({ ...prev, [name]: value, model: [] }));
      
      // Если выбрана марка, установим ее как активную для загрузки моделей
      if (Array.isArray(value) && value.length > 0) {
        setSelectedMake(value[0]);
      } else {
        // Если марка сброшена, очистим selectedMake
        setSelectedMake('');
      }
    } else {
      // Для всех остальных фильтров просто обновляем значение
      setFilters(prev => ({ ...prev, [name]: value }));
    }
  };
  
  // Применение фильтров
  const handleApplyFilters = () => {
    // Сбрасываем пагинацию при новом поиске
    setFilters(prev => ({ ...prev, page: 0 }));
    fetchCars();
  };
  
  // Сброс фильтров
  const handleResetFilters = () => {
    setFilters({
      page: 0,
      size: 10,
      sortDirection: 'DESC',
      sortBy: 'createdAt',
      make: [],
      model: [],
      bodyTypeId: [],
      fuelType: [],
      transmissionType: [],
      driveType: [],
      colorId: [],
      minMileage: undefined,
      maxMileage: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      minYear: undefined,
      maxYear: undefined,
      minHorsePower: undefined
    });
    setSelectedMake('');
    fetchCars();
  };
  
  // Обработчик пагинации
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    fetchCars();
  };
  
  // Обработчик для открытия модального окна с деталями автомобиля
  const handleShowDetails = (car: Car) => {
    setSelectedCar(car);
    setShowModal(true);
    setCurrentPhotoIndex(0); // Сбрасываем индекс фото при открытии модального окна
  };
  
  // Обработчик для закрытия модального окна
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCar(null);
    setCurrentPhotoIndex(0); // Сбрасываем индекс фото при закрытии модального окна
  };
  
  // Функция для переключения фотографий
  const handlePhotoChange = (index: number) => {
    setCurrentPhotoIndex(index);
  };
  
  // Функция для прокрутки к верху страницы
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  // Обработчик для отображения/скрытия кнопки прокрутки вверх
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollButton(true);
      } else {
        setShowScrollButton(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const [hoveredCarId, setHoveredCarId] = useState<number | null>(null);
  const [hoveredPhotoIndex, setHoveredPhotoIndex] = useState<number>(0);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  
  // Добавляем обработчик наведения курсора на изображение
  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>, car: Car) => {
    if (!car.allPhotoUrls || car.allPhotoUrls.length <= 1) return;
  
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left; // x позиция внутри элемента
    const width = rect.width;
    
    // Рассчитываем индекс фотографии на основе положения курсора
    const index = Math.min(
      Math.floor((x / width) * car.allPhotoUrls.length),
      car.allPhotoUrls.length - 1
    );
    
    if (index !== hoveredPhotoIndex) {
      setHoveredPhotoIndex(index);
    }
  };
  
  const handleImageMouseEnter = (car: Car) => {
    setHoveredCarId(car.id);
    setIsHovering(true);
    setHoveredPhotoIndex(0);
  };
  
  const handleImageMouseLeave = () => {
    setHoveredCarId(null);
    setIsHovering(false);
    setHoveredPhotoIndex(0);
  };
  
  // Добавляем состояние для полноэкранного просмотра
  const [fullscreenMode, setFullscreenMode] = useState<boolean>(false);
  const [fullscreenPhotoIndex, setFullscreenPhotoIndex] = useState<number>(0);
  const [fullscreenCar, setFullscreenCar] = useState<Car | null>(null);
  
  // Добавляем состояние для анимации переключения фотографий
  const [isPhotoChanging, setIsPhotoChanging] = useState<boolean>(false);
  
  // Обработчик для открытия полноэкранного режима
  const handleOpenFullscreen = (car: Car, index: number = 0, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setFullscreenCar(car);
    setFullscreenPhotoIndex(index);
    setFullscreenMode(true);
    document.body.style.overflow = 'hidden'; // Запрещаем прокрутку фона
  };
  
  // Обработчик для закрытия полноэкранного режима
  const handleCloseFullscreen = () => {
    setFullscreenMode(false);
    setTimeout(() => {
      setFullscreenCar(null);
      document.body.style.overflow = ''; // Возвращаем прокрутку
    }, 300); // Задержка для анимации
  };
  
  // Обработчик для клика по фону полноэкранного режима
  const handleFullscreenBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCloseFullscreen();
    }
  };
  
  // Обработчик для смены фото с анимацией
  const handleChangeFullscreenPhoto = (newIndex: number) => {
    setIsPhotoChanging(true);
    setTimeout(() => {
      setFullscreenPhotoIndex(newIndex);
      setIsPhotoChanging(false);
    }, 200);
  };
  
  // Обработчик нажатия клавиш для навигации в полноэкранном режиме
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!fullscreenMode || !fullscreenCar || !fullscreenCar.allPhotoUrls) return;
      
      if (e.key === 'Escape') {
        handleCloseFullscreen();
      } else if (e.key === 'ArrowLeft' && fullscreenCar.allPhotoUrls.length > 1) {
        const newIndex = fullscreenPhotoIndex === 0 
          ? fullscreenCar.allPhotoUrls.length - 1 
          : fullscreenPhotoIndex - 1;
        handleChangeFullscreenPhoto(newIndex);
      } else if (e.key === 'ArrowRight' && fullscreenCar.allPhotoUrls.length > 1) {
        const newIndex = fullscreenPhotoIndex === fullscreenCar.allPhotoUrls.length - 1 
          ? 0 
          : fullscreenPhotoIndex + 1;
        handleChangeFullscreenPhoto(newIndex);
      } else if (e.key === 'ArrowUp' && fullscreenCar.allPhotoUrls.length > 1) {
        // Прокрутка вверх - предыдущее фото (как на скриншоте)
        const newIndex = fullscreenPhotoIndex === 0 
          ? fullscreenCar.allPhotoUrls.length - 1 
          : fullscreenPhotoIndex - 1;
        handleChangeFullscreenPhoto(newIndex);
      } else if (e.key === 'ArrowDown' && fullscreenCar.allPhotoUrls.length > 1) {
        // Прокрутка вниз - следующее фото (как на скриншоте)
        const newIndex = fullscreenPhotoIndex === fullscreenCar.allPhotoUrls.length - 1 
          ? 0 
          : fullscreenPhotoIndex + 1;
        handleChangeFullscreenPhoto(newIndex);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenMode, fullscreenCar, fullscreenPhotoIndex]);
  
  return (
    <div className="container mt-4">
      <div id="top-section" className="mb-5">
        <div className="card rounded-4 mb-4 overflow-hidden border-0">
          <div className="position-relative">
            {/* Фоновое изображение с градиентным наложением */}
            <div className="bg-image" style={{ 
              backgroundImage: 'url(https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1200)', 
              height: '300px', 
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative'
            }}>
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                background: 'linear-gradient(135deg, rgba(26, 38, 57, 0.9) 0%, rgba(53, 99, 233, 0.8) 100%)' 
              }}></div>
            </div>
            
            {/* Контент поверх изображения */}
            <div className="position-absolute top-0 start-0 w-100 h-100">
              <div className="container h-100">
                <div className="row h-100 align-items-center">
                  <div className="col-md-7 text-white p-4">
                    <h1 className="display-5 fw-bold mb-3">Каталог автомобилей</h1>
                    <p className="lead mb-4 opacity-90">
                      Найдите идеальный автомобиль для вас среди лучших предложений
                    </p>
                    <div className="d-flex flex-wrap align-items-center gap-2 mt-3">
                      <div className="badge bg-white text-dark px-3 py-2 rounded-pill shadow-sm d-flex align-items-center">
                        <i className="bi bi-car-front fs-5 me-2" style={{ color: 'var(--accent)' }}></i>
                        <span><strong>{pagination.totalElements || 0}</strong> автомобилей</span>
                      </div>
                      <div className="badge bg-white text-dark px-3 py-2 rounded-pill shadow-sm d-flex align-items-center">
                        <i className="bi bi-tag fs-5 me-2" style={{ color: 'var(--accent)' }}></i>
                        <span>Лучшие цены</span>
                      </div>
                      <div className="badge bg-white text-dark px-3 py-2 rounded-pill shadow-sm d-flex align-items-center">
                        <i className="bi bi-shield-check fs-5 me-2" style={{ color: 'var(--accent)' }}></i>
                        <span>Проверенные продавцы</span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-5 d-none d-md-flex justify-content-center">
                    <div className="position-relative">
                      <div className="position-absolute top-50 start-50 translate-middle">
                        <div className="bg-white rounded-circle p-4 shadow-lg" style={{ width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <i className="bi bi-car-front display-1" style={{ color: 'var(--accent)' }}></i>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Filter 
        filters={filters}
        selectedMake={selectedMake}
        makes={makes}
        models={models}
        bodyTypes={bodyTypes}
        colors={colors}
        fuelTypes={fuelTypes}
        transmissionTypes={transmissionTypes}
        driveTypes={driveTypes}
        onChange={handleFilterChange}
        onFilterChange={handleDirectFilterChange}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />
      
      {/* Информация о результатах и опции отображения */}
      <div className="mb-4 bg-white p-3 rounded-4 shadow-sm border border-light">
        <div className="d-flex flex-wrap justify-content-between align-items-center">
          <div className="d-flex align-items-center mb-2 mb-md-0">
            <div className="results-count me-3 d-flex align-items-center">
              <i className="bi bi-check-circle-fill me-2 fs-5" style={{ color: 'var(--accent)' }}></i>
              <span className="fw-medium">Найдено: <strong style={{ color: 'var(--accent)' }}>{pagination.totalElements}</strong> автомобилей</span>
            </div>
            
            <div className="dropdown position-relative">
              <button
                className="btn rounded-pill px-3 py-2 d-flex align-items-center"
                style={{ 
                  backgroundColor: 'rgba(53, 99, 233, 0.1)',
                  color: 'var(--accent)',
                  border: '1px solid rgba(53, 99, 233, 0.2)',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  boxShadow: 'none'
                }}
                onClick={() => setShowSortDropdown(!showSortDropdown)}
              >
                <i className="bi bi-sort-down me-2"></i>
                Сортировка
                <i className="bi bi-chevron-down ms-2" style={{ fontSize: '0.8rem' }}></i>
              </button>
              {showSortDropdown && (
                <div 
                  className="dropdown-menu position-absolute show shadow border-0" 
                  style={{ 
                    minWidth: '240px', 
                    borderRadius: '12px', 
                    padding: '0.5rem',
                    marginTop: '0.5rem',
                    zIndex: 1000,
                    animation: 'fadeIn 0.2s ease-out'
                  }}
                  ref={sortDropdownRef}
                >
                  <div className="p-2 mb-1 text-muted small fw-medium">Сортировать по:</div>
                  <button className="dropdown-item d-flex align-items-center p-2 rounded-3" onClick={() => applySorting('price', 'ASC')}>
                    <div className="sort-icon me-2 text-center" style={{ width: '24px', color: 'var(--accent)' }}>
                      <i className="bi bi-sort-numeric-down"></i>
                    </div>
                    <span>По цене (возрастание)</span>
                  </button>
                  <button className="dropdown-item d-flex align-items-center p-2 rounded-3" onClick={() => applySorting('price', 'DESC')}>
                    <div className="sort-icon me-2 text-center" style={{ width: '24px', color: 'var(--accent)' }}>
                      <i className="bi bi-sort-numeric-up"></i>
                    </div>
                    <span>По цене (убывание)</span>
                  </button>
                  <button className="dropdown-item d-flex align-items-center p-2 rounded-3" onClick={() => applySorting('year', 'DESC')}>
                    <div className="sort-icon me-2 text-center" style={{ width: '24px', color: 'var(--accent)' }}>
                      <i className="bi bi-sort-numeric-up"></i>
                    </div>
                    <span>По году (новее)</span>
                  </button>
                  <button className="dropdown-item d-flex align-items-center p-2 rounded-3" onClick={() => applySorting('year', 'ASC')}>
                    <div className="sort-icon me-2 text-center" style={{ width: '24px', color: 'var(--accent)' }}>
                      <i className="bi bi-sort-numeric-down"></i>
                    </div>
                    <span>По году (старше)</span>
                  </button>
                  <button className="dropdown-item d-flex align-items-center p-2 rounded-3" onClick={() => applySorting('createdAt', 'DESC')}>
                    <div className="sort-icon me-2 text-center" style={{ width: '24px', color: 'var(--accent)' }}>
                      <i className="bi bi-clock"></i>
                    </div>
                    <span>По дате размещения</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="view-options d-flex align-items-center">
            <div className="btn-group shadow-sm rounded-pill overflow-hidden" role="group">
              <button 
                type="button" 
                className={`btn px-3 py-2 ${viewMode === 'grid' ? 'active' : ''}`}
                style={{ 
                  backgroundColor: viewMode === 'grid' ? 'var(--accent)' : 'white',
                  color: viewMode === 'grid' ? 'white' : 'var(--neutral-dark)',
                  borderColor: 'var(--border-light)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '30px 0 0 30px'
                }}
                onClick={() => setViewMode('grid')}
              >
                <i className="bi bi-grid-3x3-gap"></i>
              </button>
              <button 
                type="button" 
                className={`btn px-3 py-2 ${viewMode === 'list' ? 'active' : ''}`}
                style={{ 
                  backgroundColor: viewMode === 'list' ? 'var(--accent)' : 'white',
                  color: viewMode === 'list' ? 'white' : 'var(--neutral-dark)',
                  borderColor: 'var(--border-light)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '0 30px 30px 0'
                }}
                onClick={() => setViewMode('list')}
              >
                <i className="bi bi-list-ul"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Список автомобилей */}
        {loading ? (
        <div className="d-flex justify-content-center my-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Загрузка...</span>
            </div>
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
      ) : cars.length === 0 ? (
        <div className="alert alert-info">
          По вашему запросу не найдено автомобилей. Попробуйте изменить параметры фильтрации.
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'row row-cols-1 row-cols-md-3 g-4' : ''}>
          {cars.map(car => (
            <div key={car.id} className={viewMode === 'grid' ? 'col' : 'mb-4'}>
              <div className={`car-card bg-white rounded-4 shadow overflow-hidden transition-all ${viewMode === 'list' ? 'hover-shadow' : 'h-100'}`} 
                   style={{ 
                     transition: 'all 0.3s ease',
                     cursor: 'pointer',
                     border: '1px solid #f0f0f0'
                   }}
                   onClick={() => handleShowDetails(car)}>
                {viewMode === 'list' ? (
                  <div className="row g-0">
                    {/* Изображение авто */}
                    <div className="col-md-4">
                      <div 
                        className="position-relative h-100"
                        onMouseMove={(e) => handleImageMouseMove(e, car)}
                        onMouseEnter={() => handleImageMouseEnter(car)}
                        onMouseLeave={handleImageMouseLeave}
                      >
                        <img 
                          src={
                            isHovering && hoveredCarId === car.id && car.allPhotoUrls && car.allPhotoUrls.length > 0
                              ? car.allPhotoUrls[hoveredPhotoIndex]
                              : (car.mainPhotoUrl || 'https://via.placeholder.com/300x200?text=Нет+фото')
                          } 
                          className="img-fluid h-100 rounded-start" 
                          alt={`${car.make} ${car.model}`} 
                          style={{ 
                            objectFit: 'cover',
                            width: '100%',
                            minHeight: '220px',
                            maxHeight: '220px', // Фиксированная высота
                            transition: 'all 0.3s ease',
                            cursor: 'pointer' // Добавляем указатель для улучшения UX
                          }}
                          onClick={(e) => {
                            e.preventDefault(); // Предотвращаем событие по умолчанию
                            e.stopPropagation(); // Предотвращаем всплытие события
                            handleOpenFullscreen(car, hoveredPhotoIndex);
                          }}
                        />
                        {/* Индикатор количества фото */}
                        {car.allPhotoUrls && car.allPhotoUrls.length > 1 && (
                          <div className="position-absolute top-0 end-0 m-2">
                            <button 
                              className="btn btn-dark btn-sm rounded-pill opacity-75"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenFullscreen(car);
                              }}
                            >
                              <i className="bi bi-images me-1"></i> {car.allPhotoUrls.length}
                            </button>
                          </div>
                        )}
                        {/* Бейдж с годом и состоянием */}
                        <div className="position-absolute top-0 start-0 p-2 d-flex gap-2">
                          <span className="badge rounded-pill" 
                                style={{ 
                                  backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                                  color: 'var(--primary-dark)',
                                  backdropFilter: 'blur(4px)',
                                  border: '1px solid rgba(255, 255, 255, 0.3)',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}>
                            <i className="bi bi-calendar-check me-1" style={{ color: 'var(--accent)' }}></i> {car.year}
                          </span>
                          <span className="badge rounded-pill" 
                                style={{ 
                                  backgroundColor: car.condition === 'Новое' ? 'rgba(40, 167, 69, 0.9)' : 'rgba(108, 117, 125, 0.9)', 
                                  color: 'white',
                                  backdropFilter: 'blur(4px)',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}>
                            {car.condition}
                          </span>
                        </div>
                        
                        {/* Цена на мобильных устройствах */}
                        <div className="position-absolute bottom-0 end-0 p-2 d-md-none">
                          <div className="bg-white rounded-pill py-1 px-3 shadow-sm">
                            <span className="fw-bold" style={{ color: 'var(--accent)' }}>{car.price.toLocaleString()} ₽</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Информация об авто */}
                    <div className="col-md-8">
                      <div className="card-body p-4">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h5 className="card-title fw-bold mb-0" style={{ fontSize: '1.3rem', color: '#333' }}>
                            {car.make} {car.model}
                          </h5>
                          <div className="d-none d-md-block">
                            <div className="fs-5 fw-bold" style={{ color: 'var(--accent)' }}>
                              {car.price.toLocaleString()} ₽
                            </div>
                          </div>
                        </div>
                        
                        {/* Детали и характеристики */}
                        <div className="mb-3">
                          <div className="d-flex align-items-center text-muted mb-2">
                            <i className="bi bi-speedometer2 me-2" style={{ color: 'var(--accent)' }}></i>
                            <span>{car.mileage.toLocaleString()} км</span>
                            <div className="vr mx-3" style={{ height: '15px', opacity: 0.3 }}></div>
                            <i className="bi bi-geo-alt me-1" style={{ color: 'var(--accent)' }}></i>
                            <span>{car.location || 'Неизвестно'}</span>
                          </div>
                        </div>
                        
                        {/* Характеристики в виде карточек */}
                        <div className="d-flex flex-wrap gap-2 mb-3">
                          <div className="spec-card px-3 py-2 rounded-3 bg-light">
                            <i className="bi bi-fuel-pump me-1" style={{ color: 'var(--accent)' }}></i>
                            <span className="small">{car.engineInfo || `${car.technicalSpec.engineVolume || '?'} л / ${car.technicalSpec.horsePower || '?'} л.с.`}</span>
                          </div>
                          <div className="spec-card px-3 py-2 rounded-3 bg-light">
                            <i className="bi bi-gear me-1" style={{ color: 'var(--accent)' }}></i>
                            <span className="small">{car.transmissionInfo || car.technicalSpec.transmissionType}</span>
                          </div>
                          <div className="spec-card px-3 py-2 rounded-3 bg-light">
                            <i className="bi bi-car-front me-1" style={{ color: 'var(--accent)' }}></i>
                            <span className="small">{car.bodyTypeName}</span>
                          </div>
                        </div>
                        
                        {/* Нижняя часть карточки с датой и кнопкой */}
                        <div className="d-flex justify-content-between align-items-center mt-auto">
                          <small className="text-muted">
                            <i className="bi bi-clock me-1"></i> Обновлено: {new Date(car.updatedAt).toLocaleDateString()}
                          </small>
                          <button
                            className="btn rounded-pill border-0 px-3 py-2"
                            style={{
                              backgroundColor: 'var(--accent)',
                              color: 'white',
                              fontSize: '0.875rem',
                              boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShowDetails(car);
                            }}
                          >
                            <i className="bi bi-eye me-1"></i> Подробнее
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Отображение в виде сетки (Grid)
                  <div>
                    <div 
                      className="position-relative"
                      onMouseMove={(e) => handleImageMouseMove(e, car)}
                      onMouseEnter={() => handleImageMouseEnter(car)}
                      onMouseLeave={handleImageMouseLeave}
                    >
                      <img 
                        src={
                          isHovering && hoveredCarId === car.id && car.allPhotoUrls && car.allPhotoUrls.length > 0
                            ? car.allPhotoUrls[hoveredPhotoIndex]
                            : (car.mainPhotoUrl || 'https://via.placeholder.com/300x200?text=Нет+фото')
                        } 
                        className="img-fluid rounded-top" 
                        alt={`${car.make} ${car.model}`} 
                        style={{ 
                          width: '100%',
                          height: '180px',
                          objectFit: 'cover',
                          borderBottom: '1px solid #f0f0f0',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer' // Добавляем указатель для улучшения UX
                        }}
                        onClick={(e) => {
                          e.preventDefault(); // Предотвращаем событие по умолчанию
                          e.stopPropagation(); // Предотвращаем всплытие события
                          handleOpenFullscreen(car, hoveredPhotoIndex);
                        }}
                      />
                      {/* Индикатор количества фото */}
                      {car.allPhotoUrls && car.allPhotoUrls.length > 1 && (
                        <div className="position-absolute top-0 end-0 m-2">
                          <button 
                            className="btn btn-dark btn-sm rounded-pill opacity-75"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenFullscreen(car);
                            }}
                          >
                            <i className="bi bi-images me-1"></i> {car.allPhotoUrls.length}
                          </button>
                        </div>
                      )}
                      {/* Бейджи для года и цены */}
                      <div className="position-absolute top-0 start-0 p-2">
                        <span className="badge rounded-pill" 
                              style={{ 
                                backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                                color: 'var(--primary-dark)',
                                backdropFilter: 'blur(4px)',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                              }}>
                          <i className="bi bi-calendar-check me-1" style={{ color: 'var(--accent)' }}></i> {car.year}
                        </span>
                      </div>
                      
                      <div className="position-absolute top-0 end-0 p-2">
                        <span className="badge rounded-pill" 
                              style={{ 
                                backgroundColor: car.condition === 'Новое' ? 'rgba(40, 167, 69, 0.9)' : 'rgba(108, 117, 125, 0.9)', 
                                color: 'white',
                                backdropFilter: 'blur(4px)',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                              }}>
                          {car.condition}
                        </span>
                      </div>
                    </div>
                    
                    <div className="card-body p-3">
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <h5 className="card-title fw-bold mb-1">{car.make} {car.model}</h5>
                      </div>
                      
                      <div className="price-block mb-2">
                        <span className="fs-5 fw-bold" style={{ color: 'var(--accent)' }}>{car.price.toLocaleString()} ₽</span>
                      </div>
                      
                      <div className="d-flex align-items-center text-muted mb-2 small">
                        <i className="bi bi-speedometer2 me-1" style={{ color: 'var(--accent)' }}></i>
                        <span>{car.mileage.toLocaleString()} км</span>
                        <div className="vr mx-2" style={{ height: '12px', opacity: 0.3 }}></div>
                        <i className="bi bi-geo-alt me-1" style={{ color: 'var(--accent)' }}></i>
                        <span>{car.location.split(',')[0] || 'Неизвестно'}</span>
                      </div>
                      
                      <div className="specs-block small text-muted mb-2">
                        <div><i className="bi bi-fuel-pump me-1" style={{ color: 'var(--accent)' }}></i> {car.engineInfo || `${car.technicalSpec.engineVolume || '?'} л / ${car.technicalSpec.horsePower || '?'} л.с.`}</div>
                        <div><i className="bi bi-gear me-1" style={{ color: 'var(--accent)' }}></i> {car.transmissionInfo || car.technicalSpec.transmissionType}</div>
                      </div>
                      
                      <div className="mt-auto pt-2 d-grid">
                        <button 
                          className="btn rounded-pill border-0 w-100"
                          style={{
                            backgroundColor: 'var(--accent)',
                            color: 'white',
                            fontSize: '0.875rem',
                            padding: '0.5rem 0',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShowDetails(car);
                          }}
                        >
                          <i className="bi bi-eye me-1"></i> Подробнее
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Пагинация */}
      {!loading && !error && pagination.totalPages > 1 && (
        <nav aria-label="Навигация по страницам" className="my-4">
          <ul className="pagination justify-content-center">
            <li className={`page-item ${pagination.page === 0 ? 'disabled' : ''}`}>
              <button 
                className="page-link" 
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 0}
              >
                Предыдущая
              </button>
            </li>
            
            {[...Array(pagination.totalPages)].map((_, i) => (
              <li key={i} className={`page-item ${pagination.page === i ? 'active' : ''}`}>
                <button 
                  className="page-link" 
                  onClick={() => handlePageChange(i)}
                >
                  {i + 1}
                </button>
              </li>
            ))}
            
            <li className={`page-item ${pagination.page === pagination.totalPages - 1 ? 'disabled' : ''}`}>
              <button 
                className="page-link" 
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages - 1}
              >
                Следующая
              </button>
            </li>
          </ul>
        </nav>
      )}
      
      {/* Модальное окно с подробной информацией */}
      {showModal && selectedCar && (
        <div className="modal-wrapper position-fixed top-0 start-0 w-100 h-100" 
              style={{ 
                zIndex: 1050,
                perspective: '1000px'
              }}>
          <div 
            className="modal-backdrop position-fixed top-0 start-0 w-100 h-100" 
            style={{ 
              backgroundColor: 'rgba(26, 38, 57, 0.75)', 
              backdropFilter: 'blur(5px)',
              zIndex: 1051 
            }} 
            onClick={handleCloseModal}
          ></div>
          <div className="modal show d-block" style={{ zIndex: 1052 }} tabIndex={-1} role="dialog">
            <div className="modal-dialog modal-lg modal-dialog-scrollable" 
                 style={{ 
                   transform: 'translateY(30px)',
                   animation: 'modalFadeIn 0.4s ease forwards',
                   opacity: 0
                 }}>
              <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                {/* Хедер с градиентом */}
                <div className="modal-header border-0 p-0">
                  <div className="w-100 position-relative">
                    <div 
                      className="car-header p-3 px-4" 
                      style={{ 
                        background: 'linear-gradient(135deg, var(--primary-dark), var(--primary-light))',
                        color: 'white'
                      }}>
                      <div className="d-flex justify-content-between align-items-center">
                        <h5 className="modal-title my-1 fs-4 fw-bold d-flex align-items-center">
                          <i className="bi bi-car-front me-2"></i>
                          {selectedCar.make} {selectedCar.model}
                          <span className="badge rounded-pill ms-3" style={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.25)', 
                            fontSize: '0.7em',
                            padding: '0.35em 0.8em'
                          }}>{selectedCar.year} г.</span>
                        </h5>
                        <button 
                          type="button" 
                          className="btn-close btn-close-white" 
                          onClick={handleCloseModal} 
                          aria-label="Close"
                        ></button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-body p-0">
                  {/* Секция с фото и основной информацией */}
                  <div className="car-main-info">
                    <div className="row g-0">
                      <div className="col-lg-8 position-relative car-img-container">
                        <img 
                          src={selectedCar.allPhotoUrls && selectedCar.allPhotoUrls.length > 0 
                              ? selectedCar.allPhotoUrls[currentPhotoIndex] 
                              : (selectedCar.mainPhotoUrl || 'https://via.placeholder.com/600x400?text=Нет+фото')} 
                          className="img-fluid" 
                          alt={`${selectedCar.make} ${selectedCar.model}`} 
                          style={{ 
                            height: '400px', 
                            width: '100%', 
                            objectFit: 'cover',
                            cursor: 'pointer' // Добавляем указатель для улучшения UX
                          }}
                          onClick={() => {
                            // Открываем полноэкранный режим при клике на фото
                            handleOpenFullscreen(selectedCar, currentPhotoIndex);
                          }}
                        />
                        
                        {/* Кнопки навигации для фото */}
                        {selectedCar.allPhotoUrls && selectedCar.allPhotoUrls.length > 1 && (
                          <>
                            <button 
                              className="btn position-absolute top-50 start-0 translate-middle-y ms-2 rounded-circle shadow-sm" 
                              style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                width: '40px',
                                height: '40px',
                                fontSize: '1.2rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              onClick={() => {
                                setCurrentPhotoIndex(prev => 
                                  prev === 0 ? selectedCar.allPhotoUrls!.length - 1 : prev - 1
                                );
                              }}
                            >
                              <i className="bi bi-chevron-left"></i>
                            </button>
                            <button 
                              className="btn position-absolute top-50 end-0 translate-middle-y me-2 rounded-circle shadow-sm" 
                              style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.8)', 
                                width: '40px', 
                                height: '40px',
                                fontSize: '1.2rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              onClick={() => {
                                setCurrentPhotoIndex(prev => 
                                  prev === selectedCar.allPhotoUrls!.length - 1 ? 0 : prev + 1
                                );
                              }}
                            >
                              <i className="bi bi-chevron-right"></i>
                            </button>
                          </>
                        )}
                        
                        {/* Кнопка открытия полноэкранного режима */}
                        <button 
                          className="btn position-absolute top-0 end-0 m-2 rounded-pill shadow-sm" 
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            backdropFilter: 'blur(4px)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            fontSize: '0.9rem',
                            padding: '0.4rem 0.8rem',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => handleOpenFullscreen(selectedCar, currentPhotoIndex)}
                        >
                          <i className="bi bi-arrows-fullscreen me-1"></i> Полный экран
                        </button>
                        
                        {/* Значок состояния автомобиля */}
                        <div className="position-absolute top-0 start-0 m-3">
                          <div className="badge py-2 px-3 rounded-pill" style={{ 
                            backgroundColor: selectedCar.condition === 'Новое' ? 'var(--success)' : selectedCar.condition === 'Отличное' ? 'var(--accent)' : 'rgba(108, 117, 125, 0.9)',
                            color: 'white',
                            fontSize: '0.85rem',
                            fontWeight: '500',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                          }}>
                            <i className={`bi ${selectedCar.condition === 'Новое' ? 'bi-patch-check' : 'bi-speedometer'} me-1`}></i>
                            {selectedCar.condition}
                          </div>
                        </div>
                        
                        {/* Галерея внизу фото */}
                        {selectedCar.allPhotoUrls && selectedCar.allPhotoUrls.length > 0 && (
                          <div className="position-absolute bottom-0 start-0 w-100 p-2" style={{
                            background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)'
                          }}>
                            <div className="d-flex gap-2 overflow-auto p-1">
                              {selectedCar.allPhotoUrls.map((url, index) => (
                                <div key={index} className="flex-shrink-0">
                                  <img 
                                    src={url} 
                                    className={`rounded ${currentPhotoIndex === index ? 'border-2 border-primary' : 'border border-white'}`}
                                    alt={`${selectedCar.make} ${selectedCar.model} - фото ${index + 1}`} 
                                    style={{ 
                                      height: '60px', 
                                      width: '80px', 
                                      objectFit: 'cover',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease',
                                      opacity: currentPhotoIndex === index ? 1 : 0.7,
                                      transform: currentPhotoIndex === index ? 'translateY(-3px)' : 'none',
                                      boxShadow: currentPhotoIndex === index ? '0 4px 10px rgba(0,0,0,0.3)' : 'none'
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCurrentPhotoIndex(index);
                                    }}
                                    onDoubleClick={(e) => {
                                      e.stopPropagation();
                                      // Открываем полноэкранный режим при двойном клике
                                      handleOpenFullscreen(selectedCar, index);
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="col-lg-4 p-4">
                        <div className="modal-animation-container">
                          {/* Цена с анимацией */}
                          <div className="price-block mb-4">
                            <div className="fs-4 fw-bold price-pulse" style={{ color: 'var(--accent)' }}>
                              {selectedCar.price.toLocaleString()} ₽
                            </div>
                            <div className="text-muted small">
                              <i className="bi bi-calendar3 me-1"></i> Размещено: {new Date(selectedCar.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          
                          {/* Локация */}
                          <div className="location-block mb-4 p-3 rounded-3" style={{ 
                            backgroundColor: 'rgba(249, 199, 132, 0.15)',
                            border: '1px solid rgba(249, 199, 132, 0.3)'
                          }}>
                            <h6 className="fw-bold mb-2 d-flex align-items-center">
                              <i className="bi bi-geo-alt me-2" style={{ color: 'var(--accent)' }}></i>
                              Местоположение
                            </h6>
                            <div className="d-flex align-items-center">
                              <span>{selectedCar.location}</span>
                            </div>
                          </div>
                          
                          {/* Ключевые характеристики */}
                          <div className="specs-highlight mb-4">
                            <div className="row row-cols-2 g-2">
                              <div className="col">
                                <div className="spec-item p-2 text-center rounded-3 border" style={{ borderColor: 'var(--border-light)' }}>
                                  <div className="spec-icon mb-1">
                                    <i className="bi bi-speedometer2" style={{ color: 'var(--accent)', fontSize: '1.2rem' }}></i>
                                  </div>
                                  <div className="spec-value fw-bold">{selectedCar.mileage.toLocaleString()} км</div>
                                  <div className="spec-label text-muted small">Пробег</div>
                                </div>
                              </div>
                              <div className="col">
                                <div className="spec-item p-2 text-center rounded-3 border" style={{ borderColor: 'var(--border-light)' }}>
                                  <div className="spec-icon mb-1">
                                    <i className="bi bi-fuel-pump" style={{ color: 'var(--accent)', fontSize: '1.2rem' }}></i>
                                  </div>
                                  <div className="spec-value fw-bold">{selectedCar.technicalSpec.engineVolume} л</div>
                                  <div className="spec-label text-muted small">Объем двигателя</div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Кнопки действий */}
                          <div className="d-grid gap-2">
                            <button 
                              className="btn py-2 position-relative overflow-hidden" 
                              style={{ 
                                backgroundColor: 'var(--accent)', 
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                boxShadow: '0 4px 10px rgba(53, 99, 233, 0.3)',
                                transition: 'all 0.3s ease'
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--accent-light)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 12px rgba(53, 99, 233, 0.4)';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--accent)';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 10px rgba(53, 99, 233, 0.3)';
                              }}
                            >
                              <span className="d-flex align-items-center justify-content-center">
                                <i className="bi bi-telephone me-2 fs-5"></i> 
                                <span className="fw-medium">Позвонить продавцу</span>
                              </span>
                            </button>
                            <button 
                              className="btn py-2" 
                              style={{ 
                                backgroundColor: 'rgba(53, 99, 233, 0.1)', 
                                color: 'var(--accent)',
                                border: '1px solid rgba(53, 99, 233, 0.2)',
                                borderRadius: '8px',
                                transition: 'all 0.3s ease'
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(53, 99, 233, 0.15)';
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(53, 99, 233, 0.1)';
                              }}
                            >
                              <span className="d-flex align-items-center justify-content-center">
                                <i className="bi bi-chat-dots me-2 fs-5"></i>
                                <span className="fw-medium">Написать сообщение</span>
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Табы с характеристиками, комплектацией и т.д. */}
                  <div className="car-details p-4">
                    {/* Технические характеристики */}
                    <div className="mb-4">
                      <h5 className="d-flex align-items-center mb-3" style={{ color: 'var(--primary-dark)' }}>
                        <span className="icon-wrapper me-2 d-flex align-items-center justify-content-center rounded-circle" style={{ 
                          width: '32px', 
                          height: '32px', 
                          backgroundColor: 'rgba(53, 99, 233, 0.1)'
                        }}>
                          <i className="bi bi-gear" style={{ color: 'var(--accent)' }}></i>
                        </span>
                        Технические характеристики
                      </h5>
                      <div className="row row-cols-1 row-cols-md-2 g-3">
                        <div className="col">
                          <div className="p-3 rounded-4" style={{ backgroundColor: 'rgba(245, 245, 245, 0.5)', border: '1px solid var(--border-light)' }}>
                            <h6 className="fw-bold mb-3" style={{ color: 'var(--primary-dark)', fontSize: '0.9rem' }}>Двигатель и привод</h6>
                            <ul className="list-unstyled mb-0">
                              <li className="d-flex justify-content-between py-2 border-bottom" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                                <span className="text-muted">Двигатель</span>
                                <span className="fw-medium text-end">{selectedCar.engineInfo}</span>
                              </li>
                              <li className="d-flex justify-content-between py-2 border-bottom" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                                <span className="text-muted">Тип топлива</span>
                                <span className="fw-medium text-end">{selectedCar.technicalSpec.fuelType}</span>
                              </li>
                              <li className="d-flex justify-content-between py-2 border-bottom" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                                <span className="text-muted">Мощность</span>
                                <span className="fw-medium text-end">{selectedCar.technicalSpec.horsePower} л.с.</span>
                              </li>
                              <li className="d-flex justify-content-between py-2">
                                <span className="text-muted">Объем двигателя</span>
                                <span className="fw-medium text-end">{selectedCar.technicalSpec.engineVolume} л</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                        <div className="col">
                          <div className="p-3 rounded-4" style={{ backgroundColor: 'rgba(245, 245, 245, 0.5)', border: '1px solid var(--border-light)' }}>
                            <h6 className="fw-bold mb-3" style={{ color: 'var(--primary-dark)', fontSize: '0.9rem' }}>Трансмиссия и кузов</h6>
                            <ul className="list-unstyled mb-0">
                              <li className="d-flex justify-content-between py-2 border-bottom" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                                <span className="text-muted">Коробка передач</span>
                                <span className="fw-medium text-end">{selectedCar.transmissionInfo}</span>
                              </li>
                              <li className="d-flex justify-content-between py-2 border-bottom" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                                <span className="text-muted">Привод</span>
                                <span className="fw-medium text-end">{selectedCar.technicalSpec.driveType}</span>
                              </li>
                              <li className="d-flex justify-content-between py-2 border-bottom" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                                <span className="text-muted">Тип кузова</span>
                                <span className="fw-medium text-end">{selectedCar.bodyTypeName}</span>
                              </li>
                              <li className="d-flex justify-content-between py-2">
                                <span className="text-muted">Цвет</span>
                                <span className="fw-medium text-end d-flex align-items-center">
                                  <span className="color-dot me-1 rounded-circle" style={{ 
                                    width: '14px', 
                                    height: '14px', 
                                    backgroundColor: selectedCar.colorName.toLowerCase() === 'белый' ? '#ffffff' :
                                                    selectedCar.colorName.toLowerCase() === 'черный' ? '#000000' :
                                                    selectedCar.colorName.toLowerCase() === 'красный' ? '#ff0000' :
                                                    selectedCar.colorName.toLowerCase() === 'синий' ? '#0000ff' :
                                                    selectedCar.colorName.toLowerCase() === 'серебристый' ? '#C0C0C0' : '#808080',
                                    border: selectedCar.colorName.toLowerCase() === 'белый' ? '1px solid #ddd' : 'none'
                                  }}></span>
                                  {selectedCar.colorName}
                                </span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Комплектация и безопасность */}
                    <div className="row">
                      {/* Безопасность */}
                      {selectedCar.safetyFeatures && selectedCar.safetyFeatures.length > 0 && (
                        <div className="col-md-6 mb-4">
                          <h5 className="d-flex align-items-center mb-3" style={{ color: 'var(--primary-dark)' }}>
                            <span className="icon-wrapper me-2 d-flex align-items-center justify-content-center rounded-circle" style={{ 
                              width: '32px', 
                              height: '32px', 
                              backgroundColor: 'rgba(53, 99, 233, 0.1)'
                            }}>
                              <i className="bi bi-shield-check" style={{ color: 'var(--accent)' }}></i>
                            </span>
                            Безопасность
                          </h5>
                          <div className="d-flex flex-wrap gap-2 badge-animation-container">
                            {selectedCar.safetyFeatures.map((feature, index) => (
                              <span 
                                key={index} 
                                className="badge rounded-pill py-2 px-3" 
                                style={{ 
                                  backgroundColor: 'rgba(53, 99, 233, 0.1)', 
                                  color: 'var(--accent)',
                                  border: '1px solid rgba(53, 99, 233, 0.2)',
                                  '--animation-order': index
                                } as React.CSSProperties}
                              >
                                <i className="bi bi-check-circle-fill me-1"></i> {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Комплектация */}
                      {selectedCar.equipment && selectedCar.equipment.length > 0 && (
                        <div className="col-md-6 mb-4">
                          <h5 className="d-flex align-items-center mb-3" style={{ color: 'var(--primary-dark)' }}>
                            <span className="icon-wrapper me-2 d-flex align-items-center justify-content-center rounded-circle" style={{ 
                              width: '32px', 
                              height: '32px', 
                              backgroundColor: 'rgba(53, 99, 233, 0.1)'
                            }}>
                              <i className="bi bi-list-check" style={{ color: 'var(--accent)' }}></i>
                            </span>
                            Комплектация
                          </h5>
                          <div className="d-flex flex-wrap gap-2 badge-animation-container">
                            {selectedCar.equipment.map((item, index) => (
                              <span 
                                key={index} 
                                className="badge rounded-pill py-2 px-3" 
                                style={{ 
                                  backgroundColor: 'rgba(48, 175, 91, 0.1)', 
                                  color: 'var(--success)',
                                  border: '1px solid rgba(48, 175, 91, 0.2)',
                                  '--animation-order': index
                                } as React.CSSProperties}
                              >
                                <i className="bi bi-check2 me-1"></i> {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="modal-footer justify-content-between border-0 bg-light p-3">
                  <span className="small text-muted d-flex align-items-center">
                    <i className="bi bi-info-circle me-1"></i> ID автомобиля: {selectedCar.id}
                  </span>
                  <button 
                    type="button" 
                    className="btn btn-sm rounded-pill px-3 py-2" 
                    style={{ 
                      backgroundColor: 'var(--primary-dark)',
                      color: 'white',
                      border: 'none'
                    }} 
                    onClick={handleCloseModal}
                  >
                    <i className="bi bi-x-lg me-1"></i> Закрыть
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* CSS стили для анимации модального окна */}
      <style>
        {`
          @keyframes modalFadeIn {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes fadeInRight {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
          }
          
          @keyframes fadeInLeft {
            from { opacity: 0; transform: translateX(20px); }
            to { opacity: 1; transform: translateX(0); }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes pulseSoft {
            0% { transform: scale(1); }
            50% { transform: scale(1.03); }
            100% { transform: scale(1); }
          }
          
          .price-pulse {
            animation: pulseSoft 2s ease-in-out infinite;
          }
          
          .modal-animation-container > *:nth-child(1) { animation: fadeInUp 0.5s ease-out 0.1s both; }
          .modal-animation-container > *:nth-child(2) { animation: fadeInUp 0.5s ease-out 0.2s both; }
          .modal-animation-container > *:nth-child(3) { animation: fadeInUp 0.5s ease-out 0.3s both; }
          .modal-animation-container > *:nth-child(4) { animation: fadeInUp 0.5s ease-out 0.4s both; }
          
          .specs-highlight .row > *:nth-child(1) { animation: fadeInRight 0.5s ease-out 0.3s both; }
          .specs-highlight .row > *:nth-child(2) { animation: fadeInLeft 0.5s ease-out 0.3s both; }
          
          .car-img-container { animation: fadeIn 0.8s ease-out 0.1s both; }
          
          .badge-animation-container > * { animation: fadeIn 0.5s ease-out calc(0.2s + var(--animation-order, 0) * 0.1s) both; }
        `}
      </style>
      
      {/* Кнопка для прокрутки к верху */}
      {showScrollButton && (
        <button 
          className={`btn-scroll-to-top rounded-circle position-fixed bottom-0 end-0 m-4 shadow-lg ${showScrollButton ? 'visible' : ''}`}
          onClick={scrollToTop}
          style={{ 
            zIndex: 1000, 
            backgroundColor: 'var(--accent)',
            color: 'white',
            width: '56px',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            border: 'none'
          }}
        >
          <i className="bi bi-arrow-up fs-5"></i>
        </button>
      )}
      
      {/* Добавляем стили для анимаций */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          @keyframes fadeInUp {
            from { 
              opacity: 0;
              transform: translateY(20px);
            }
            to { 
              opacity: 0.9;
              transform: translateY(0);
            }
          }
          
          .car-card {
            animation: fadeIn 0.5s ease-out;
          }
        `}
      </style>
      
      {/* Полноэкранный режим просмотра фотографий */}
      {fullscreenMode && fullscreenCar && (
        <div 
          className="fullscreen-overlay position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
          style={{ 
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.3s ease',
            overflow: 'hidden'
          }}
          onClick={handleCloseFullscreen}
        >
          {/* Контейнер для вертикального списка фотографий */}
          <div 
            className="fullscreen-container position-relative"
            style={{ 
              width: '95%',
              height: '92%',
              maxWidth: '1600px',
              display: 'flex',
              overflow: 'hidden',
              borderRadius: '8px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Левая колонка с миниатюрами фото */}
            <div 
              className="photo-thumbnails-column"
              style={{
                width: '120px',
                height: '100%',
                overflowY: 'auto',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: '15px 10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                zIndex: 2
              }}
            >
              {fullscreenCar.allPhotoUrls && fullscreenCar.allPhotoUrls.length > 0 ? (
                <>
                  {fullscreenCar.allPhotoUrls.map((url, index) => (
                    <div 
                      key={index} 
                      className="position-relative"
                      style={{
                        cursor: 'pointer',
                        border: fullscreenPhotoIndex === index ? '2px solid var(--accent)' : '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '4px',
                        transition: 'all 0.2s',
                        transform: fullscreenPhotoIndex === index ? 'scale(1.05)' : 'scale(1)',
                        opacity: fullscreenPhotoIndex === index ? 1 : 0.6,
                        width: '100px',
                        height: '75px',
                        marginBottom: '10px',
                        overflow: 'hidden',
                        boxShadow: fullscreenPhotoIndex === index ? '0 0 15px rgba(255, 255, 255, 0.3)' : 'none'
                      }}
                      onClick={() => {
                        setFullscreenPhotoIndex(index);
                        // Прокручиваем к выбранной фотографии в вертикальном списке
                        const photoElement = document.getElementById(`fullscreen-photo-${index}`);
                        if (photoElement) {
                          photoElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                      }}
                    >
                      <img 
                        src={url} 
                        alt={`Фото ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                      {fullscreenPhotoIndex === index && (
                        <div 
                          className="position-absolute top-0 start-0 w-100 h-100" 
                          style={{
                            backgroundColor: 'rgba(53, 99, 233, 0.15)',
                            border: '2px solid var(--accent)',
                            borderRadius: '3px'
                          }}
                        />
                      )}
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-white text-center small">
                  Нет фотографий
                </div>
              )}
            </div>
            
            {/* Основная секция с вертикальным списком фотографий */}
            <div 
              className="vertical-photos-section position-relative"
              style={{
                flex: 1,
                height: '100%',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Размытый фон текущей фотографии */}
              <div 
                className="blurred-background position-absolute w-100 h-100"
                style={{
                  top: 0,
                  left: 0,
                  backgroundImage: fullscreenCar.allPhotoUrls && fullscreenCar.allPhotoUrls.length > 0 
                    ? `url(${fullscreenCar.allPhotoUrls[fullscreenPhotoIndex]})` 
                    : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(30px)',
                  opacity: 0.6,
                  zIndex: -1,
                  transform: 'scale(1.1)',
                  transition: 'background-image 0.3s ease-in-out'
                }}
              />
              
              {/* Дополнительное затемнение для улучшения видимости */}
              <div 
                className="overlay-dim position-absolute w-100 h-100"
                style={{
                  top: 0,
                  left: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  zIndex: -1
                }}
              />
              
              {/* Вертикальный скролл-контейнер для фотографий */}
              <div 
                className="vertical-photos-scroll"
                style={{
                  height: '100%',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  scrollBehavior: 'smooth',
                  paddingBottom: '30px'
                }}
                onScroll={(e) => {
                  // Определяем текущую видимую фотографию при скролле
                  const container = e.currentTarget;
                  const containerHeight = container.clientHeight;
                  const containerTop = container.scrollTop;
                  const containerCenter = containerTop + containerHeight / 2;
                  
                  if (fullscreenCar.allPhotoUrls) {
                    // Находим фото, которое наиболее полно отображается в центре видимой области
                    let closestPhotoIndex = 0;
                    let closestDistance = Infinity;
                    
                    fullscreenCar.allPhotoUrls.forEach((_, index) => {
                      const photoElement = document.getElementById(`fullscreen-photo-${index}`);
                      if (photoElement) {
                        const photoRect = photoElement.getBoundingClientRect();
                        const photoMiddle = photoRect.top + photoRect.height / 2;
                        const viewportMiddle = window.innerHeight / 2;
                        const distance = Math.abs(photoMiddle - viewportMiddle);
                        
                        if (distance < closestDistance) {
                          closestDistance = distance;
                          closestPhotoIndex = index;
                        }
                      }
                    });
                    
                    if (closestPhotoIndex !== fullscreenPhotoIndex) {
                      setFullscreenPhotoIndex(closestPhotoIndex);
                    }
                  }
                }}
              >
                <div className="photos-container d-flex flex-column align-items-center py-4">
                  {fullscreenCar.allPhotoUrls && fullscreenCar.allPhotoUrls.length > 0 ? (
                    <>
                      {fullscreenCar.allPhotoUrls.map((url, index) => (
                        <div 
                          id={`fullscreen-photo-${index}`}
                          key={index} 
                          className="photo-container mb-4 position-relative"
                          style={{
                            width: '85%',
                            maxWidth: '900px',
                            marginBottom: '30px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
                            transition: 'transform 0.3s ease',
                            transform: fullscreenPhotoIndex === index ? 'scale(1.02)' : 'scale(1)',
                          }}
                        >
                          <img 
                            src={url} 
                            alt={`${fullscreenCar.make} ${fullscreenCar.model} - фото ${index + 1}`} 
                            style={{
                              width: '100%',
                              maxHeight: '80vh',
                              objectFit: 'cover',
                              display: 'block'
                            }}
                            onClick={() => setFullscreenPhotoIndex(index)}
                          />
                          
                          {/* Индикатор номера фотографии */}
                          <div 
                            className="photo-number position-absolute top-0 end-0 m-3 px-2 py-1"
                            style={{
                              backgroundColor: 'rgba(0, 0, 0, 0.6)',
                              color: 'white',
                              borderRadius: '4px',
                              fontSize: '0.8rem'
                            }}
                          >
                            {index + 1} / {fullscreenCar.allPhotoUrls.length}
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                      <p className="text-white">Нет фотографий для отображения</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Стрелки для навигации */}
              <button 
                className="nav-arrow nav-arrow-up position-absolute start-50 translate-middle-x"
                style={{
                  top: '15px',
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1010,
                  cursor: 'pointer'
                }}
                onClick={() => {
                  if (fullscreenCar.allPhotoUrls && fullscreenCar.allPhotoUrls.length > 1) {
                    const newIndex = fullscreenPhotoIndex === 0 
                      ? fullscreenCar.allPhotoUrls.length - 1 
                      : fullscreenPhotoIndex - 1;
                    setFullscreenPhotoIndex(newIndex);
                    
                    const photoElement = document.getElementById(`fullscreen-photo-${newIndex}`);
                    if (photoElement) {
                      photoElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }
                }}
              >
                <i className="bi bi-chevron-up"></i>
              </button>
              
              <button 
                className="nav-arrow nav-arrow-down position-absolute start-50 translate-middle-x"
                style={{
                  bottom: '15px',
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1010,
                  cursor: 'pointer'
                }}
                onClick={() => {
                  if (fullscreenCar.allPhotoUrls && fullscreenCar.allPhotoUrls.length > 1) {
                    const newIndex = fullscreenPhotoIndex === fullscreenCar.allPhotoUrls.length - 1 
                      ? 0 
                      : fullscreenPhotoIndex + 1;
                    setFullscreenPhotoIndex(newIndex);
                    
                    const photoElement = document.getElementById(`fullscreen-photo-${newIndex}`);
                    if (photoElement) {
                      photoElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }
                }}
              >
                <i className="bi bi-chevron-down"></i>
              </button>
            </div>
            
            {/* Правая колонка с информацией о машине */}
            <div 
              className="car-info-sidebar"
              style={{
                width: '350px',
                height: '100%',
                padding: '25px',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                overflowY: 'auto',
                color: 'white',
                zIndex: 2
              }}
            >
              <h4 className="mb-3 fw-bold d-flex align-items-center">
                <span className="me-2">{fullscreenCar.make} {fullscreenCar.model}</span>
                <span className="badge rounded-pill" style={{ backgroundColor: 'var(--accent)', fontSize: '0.7rem' }}>
                  {fullscreenCar.year}
                </span>
              </h4>
              
              <div className="price-block mb-4">
                <div className="fs-4 fw-bold" style={{ color: 'var(--accent)' }}>
                  {fullscreenCar.price.toLocaleString()} ₽
                </div>
                <div className="text-light small">
                  <i className="bi bi-geo-alt me-1"></i> {fullscreenCar.location}
                </div>
              </div>
              
              <div className="specs-block mb-4">
                <h6 className="fw-bold mb-3 border-bottom pb-2">Характеристики</h6>
                
                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-light">Тип кузова:</span>
                    <span className="fw-medium">{fullscreenCar.bodyTypeName}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-light">Пробег:</span>
                    <span className="fw-medium">{fullscreenCar.mileage.toLocaleString()} км</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-light">Цвет:</span>
                    <span className="fw-medium">{fullscreenCar.colorName}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-light">Двигатель:</span>
                    <span className="fw-medium">{fullscreenCar.engineInfo}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-light">Коробка:</span>
                    <span className="fw-medium">{fullscreenCar.transmissionInfo}</span>
                  </div>
                  
                  <h6 className="fw-bold mb-3 mt-4 border-bottom pb-2">Технические данные</h6>
                  
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-light">Тип топлива:</span>
                    <span className="fw-medium">{fullscreenCar.technicalSpec.fuelType}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-light">Мощность:</span>
                    <span className="fw-medium">{fullscreenCar.technicalSpec.horsePower} л.с.</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-light">Объем двигателя:</span>
                    <span className="fw-medium">{fullscreenCar.technicalSpec.engineVolume} л</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-light">Привод:</span>
                    <span className="fw-medium">{fullscreenCar.technicalSpec.driveType}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-light">Тип КПП:</span>
                    <span className="fw-medium">{fullscreenCar.technicalSpec.transmissionType}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-light">Количество передач:</span>
                    <span className="fw-medium">{fullscreenCar.technicalSpec.gears}</span>
                  </div>
                </div>
              </div>
              
              {fullscreenCar.equipment && fullscreenCar.equipment.length > 0 && (
                <div className="equipment-block mb-4">
                  <h6 className="fw-bold mb-3 border-bottom pb-2">Комплектация</h6>
                  <ul className="equipment-list ps-3 small">
                    {fullscreenCar.equipment.slice(0, 12).map((item, index) => (
                      <li key={index} className="mb-1">{item}</li>
                    ))}
                    {fullscreenCar.equipment.length > 12 && (
                      <div className="text-accent small mt-2">+ еще {fullscreenCar.equipment.length - 12} опций</div>
                    )}
                  </ul>
                </div>
              )}
            </div>
            
            {/* Кнопка закрытия */}
            <button 
              className="position-absolute top-0 end-0 m-3 bg-transparent border-0 text-white"
              style={{ 
                fontSize: '1.5rem',
                zIndex: 1020,
                opacity: 0.8,
                cursor: 'pointer'
              }}
              onClick={handleCloseFullscreen}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
      )}
      
      {/* Обновляем стили программно, через JavaScript */}
      {(() => {
        // Создаем и добавляем глобальные стили
        const styleSheet = document.createElement('style');
        styleSheet.innerHTML = `
          /* Стили для карточек и эффектов наведения */
          .car-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
          }
          
          /* Стили для полноэкранного режима просмотра */
          .btn-scroll-to-top {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background-color: var(--accent);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            opacity: 0;
            transition: all 0.3s ease;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            transform: translateY(20px);
          }
          
          .btn-scroll-to-top.visible {
            opacity: 0.9;
            transform: translateY(0);
          }
          
          .btn-scroll-to-top:hover {
            opacity: 1;
            transform: translateY(-5px);
            box-shadow: 0 10px 20px rgba(53, 99, 233, 0.3);
          }
          
          /* Анимация смены фотографий */
          .photo-changing {
            opacity: 0;
            transform: scale(0.95);
            transition: all 0.3s ease;
          }
          
          .photo-visible {
            opacity: 1;
            transform: scale(1);
            transition: all 0.3s ease;
          }
          
          /* Улучшенные стили для полноэкранного режима */
          .fullscreen-overlay {
            background-color: rgba(0,0,0,0.8);
            transition: all 0.3s ease;
          }
          
          .fullscreen-container {
            animation: fadeIn 0.3s ease;
          }
          
          /* Стили для скроллбаров */
          .photo-thumbnails-column::-webkit-scrollbar,
          .vertical-photos-scroll::-webkit-scrollbar,
          .car-info-sidebar::-webkit-scrollbar {
            width: 6px;
          }
          
          .photo-thumbnails-column::-webkit-scrollbar-track,
          .vertical-photos-scroll::-webkit-scrollbar-track,
          .car-info-sidebar::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 10px;
          }
          
          .photo-thumbnails-column::-webkit-scrollbar-thumb,
          .vertical-photos-scroll::-webkit-scrollbar-thumb,
          .car-info-sidebar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 10px;
          }
          
          .photo-thumbnails-column::-webkit-scrollbar-thumb:hover,
          .vertical-photos-scroll::-webkit-scrollbar-thumb:hover,
          .car-info-sidebar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
          }
          
          /* Стили выбора текста */
          ::selection {
            background-color: var(--accent);
            color: white;
          }
          
          /* Навигационные кнопки */
          .nav-arrow {
            opacity: 0.7;
            transition: all 0.2s ease;
          }
          
          .nav-arrow:hover {
            opacity: 1;
            transform: translate(-50%, 0) scale(1.1);
          }
          
          /* Стили для элементов комплектации */
          .equipment-list li {
            position: relative;
            list-style-type: none;
            padding-left: 15px;
          }
          
          .equipment-list li:before {
            content: '•';
            position: absolute;
            left: 0;
            color: var(--accent);
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
        `;
        return null; // Ничего не рендерим в JSX
      })()}
    </div>
  );
};

export default MainContainer;