import axios from 'axios';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Filter from './Filter';
import { parseCars } from '../services/AutoRuParser';

interface Car {
  id: number | string;
  make: string;
  model: string;
  year: number;
  bodyTypeName?: string;
  price: number;
  mileage?: number;
  engineInfo?: string;
  transmissionInfo?: string;
  colorName?: string;
  condition?: string;
  location?: string;
  mainPhotoUrl?: string;
  allPhotoUrls?: string[];
  safetyFeatures?: string[];
  equipment?: string[];
  technicalSpec?: {
    fuelType: string;
    engineVolume?: number;
    horsePower?: number;
    driveType: string;
    transmissionType: string;
    gears?: number;
  };
  createdAt?: string;
  updatedAt?: string;
  fuelType?: string; // From external parser
  color?: string; // From external parser
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
  content?: T;
  totalPages?: number;
  totalElements?: number;
  number?: number;
}

export interface CarFilter { // Exporting for potential use elsewhere if needed
  make?: string[];
  model?: string[];
  minYear?: number;
  maxYear?: number;
  minPrice?: number;
  maxPrice?: number;
  minMileage?: number;
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
  const API_URL = 'http://localhost:5000/api'; // Already set
  const [cars, setCars] = useState<Car[]>([]);
  const [allExternalCars, setAllExternalCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [modelsLoading, setModelsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 0, totalPages: 0, totalElements: 0 });

  const [bodyTypes, setBodyTypes] = useState<BodyType[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [fuelTypes, setFuelTypes] = useState<string[]>([]);
  const [transmissionTypes, setTransmissionTypes] = useState<string[]>([]);
  const [driveTypes, setDriveTypes] = useState<string[]>([]);

  // Состояния для модального окна подробного просмотра
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number>(0);
  
  // Состояния для полноэкранного режима просмотра фотографий
  const [fullscreenMode, setFullscreenMode] = useState<boolean>(false);
  const [fullscreenCar, setFullscreenCar] = useState<Car | null>(null);
  const [fullscreenPhotoIndex, setFullscreenPhotoIndex] = useState<number>(0);
  const [isPhotoChanging, setIsPhotoChanging] = useState<boolean>(false);
  
  // Состояние для наведения на фото
  const [hoveredCarId, setHoveredCarId] = useState<number | string | null>(null);
  const [hoveredPhotoIndex, setHoveredPhotoIndex] = useState<number>(0);
  const [isHovering, setIsHovering] = useState<boolean>(false);

  const [showScrollButton, setShowScrollButton] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showSortDropdown, setShowSortDropdown] = useState<boolean>(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  const [activeDataSource, setActiveDataSource] = useState<'local' | 'external'>('local');
  const [parserErrorOccurred, setParserErrorOccurred] = useState<boolean>(false);

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
  });

  useEffect(() => {
    const fetchDictionaries = async () => {
      setLoading(true);
      try {
        const [bodyTypesRes, colorsRes, makesRes, fuelTypesRes, transmissionTypesRes, driveTypesRes] = await Promise.all([
          axios.get<ApiResponse<BodyType[]>>(`${API_URL}/dictionary/body-types`),
          axios.get<ApiResponse<Color[]>>(`${API_URL}/dictionary/colors`),
          axios.get<ApiResponse<string[]>>(`${API_URL}/cars/makes`),
          axios.get<ApiResponse<string[]>>(`${API_URL}/dictionary/fuel-types`),
          axios.get<ApiResponse<string[]>>(`${API_URL}/dictionary/transmission-types`),
          axios.get<ApiResponse<string[]>>(`${API_URL}/dictionary/drive-types`)
        ]);

        setBodyTypes(bodyTypesRes.data?.data || bodyTypesRes.data?.content || []);
        setColors(colorsRes.data?.data || colorsRes.data?.content || []);
        
        const extractStringArray = (response: any): string[] => {
          const data = response?.data?.data || response?.data?.content;
          if (Array.isArray(data)) {
            return data.filter((item: any) => typeof item === 'string' && item.trim().length > 0).sort();
          }
          return [];
        };

        setMakes(extractStringArray(makesRes));
        setFuelTypes(extractStringArray(fuelTypesRes));
        setTransmissionTypes(extractStringArray(transmissionTypesRes));
        setDriveTypes(extractStringArray(driveTypesRes));

      } catch (err) {
        console.error('Ошибка при загрузке справочников:', err);
        setError('Не удалось загрузить справочные данные');
        setBodyTypes([{ id: 1, name: "Седан" }]);
        setColors([{ id: 1, name: "Черный", hexCode: "#000000" }]);
        setMakes(["Toyota", "BMW", "Mercedes-Benz"].sort());
        setFuelTypes(["Бензин", "Дизель"].sort());
        setTransmissionTypes(["Автоматическая", "Механическая"].sort());
        setDriveTypes(["Передний", "Задний"].sort());
      } finally {
        setLoading(false);
      }
    };
    fetchDictionaries();
  }, [API_URL]);

  useEffect(() => {
    const fetchModelsForSelectedMakes = async () => {
      if (filters.make && filters.make.length > 0) {
        setModelsLoading(true);
        try {
          const modelRequests = (filters.make || []).map(makeName =>
            axios.get<ApiResponse<string[]>>(`${API_URL}/cars/models`, { params: { make: makeName } })
          );
          const responses = await Promise.all(modelRequests);
          const allModelsArrays = responses.map(res => res.data?.data || res.data?.content || []);
          const combinedModels = allModelsArrays.flat();
          const uniqueModels = [...new Set(combinedModels)]
            .filter(model => typeof model === 'string' && model.trim().length > 0)
            .sort();
          setModels(uniqueModels);
        } catch (error) {
          console.error("Error fetching models:", error);
          setModels([]);
        } finally {
          setModelsLoading(false);
        }
      } else {
        setModels([]);
      }
    };
    fetchModelsForSelectedMakes();
  }, [filters.make, API_URL]);

  const fetchLocalCars = useCallback(async (currentFilters: CarFilter) => {
    setLoading(true);
    setError(null);
    setParserErrorOccurred(false);
    try {
      const params: Record<string, string | number> = {};

      for (const key in currentFilters) {
        if (Object.prototype.hasOwnProperty.call(currentFilters, key)) {
          const filterKey = key as keyof CarFilter;
          const value = currentFilters[filterKey];

          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              if (value.length > 0) {
                params[filterKey] = value.join(',');
              }
            } else if (typeof value === 'string') {
              if (value.trim() !== '') {
                params[filterKey] = value;
              }
            } else if (typeof value === 'number') {
              params[filterKey] = value;
            }
          }
        }
      }

      params.page = currentFilters.page !== undefined ? currentFilters.page : 0;
      params.size = currentFilters.size !== undefined ? currentFilters.size : 10;
      if (currentFilters.sortBy) params.sortBy = currentFilters.sortBy;
      if (currentFilters.sortDirection) params.sortDirection = currentFilters.sortDirection;
      
      console.log("Requesting /cars with params:", params);

      const response = await axios.get<ApiResponse<Car[]>>(`${API_URL}/cars`, { params });
      const responseData = response.data?.data || response.data?.content || [];
      setCars(responseData);
      setPagination({
        page: response.data?.number !== undefined ? response.data.number : 0,
        totalPages: response.data?.totalPages || 0,
        totalElements: response.data?.totalElements || 0,
      });
    } catch (err: any) {
      console.error('Ошибка при загрузке автомобилей из БД:', err);
      if (axios.isAxiosError(err) && err.response) {
        console.error('Backend error details:', err.response.data);
        setError(`Не удалось загрузить автомобили: ${err.response.status} ${err.response.statusText}. Детали: ${JSON.stringify(err.response.data)}`);
      } else {
        setError('Не удалось загрузить автомобили из базы данных. Проверьте консоль для подробностей.');
      }
      setCars([]);
    } finally {
      setLoading(false);
    }
  }, [API_URL]); 

  const applyFiltersToExternalCars = useCallback((allCars: Car[], currentFilters: CarFilter) => {
    let filtered = [...allCars];
    if (currentFilters.make && currentFilters.make.length > 0) {
        filtered = filtered.filter(car => currentFilters.make!.includes(car.make));
    }
    if (currentFilters.model && currentFilters.model.length > 0) {
        filtered = filtered.filter(car => currentFilters.model!.includes(car.model));
    }
    if (currentFilters.minYear) {
        filtered = filtered.filter(car => car.year >= currentFilters.minYear!);
    }
    if (currentFilters.maxYear) {
        filtered = filtered.filter(car => car.year <= currentFilters.maxYear!);
    }
    if (currentFilters.minPrice) {
        filtered = filtered.filter(car => car.price >= currentFilters.minPrice!);
    }
    if (currentFilters.maxPrice) {
        filtered = filtered.filter(car => car.price <= currentFilters.maxPrice!);
    }
    if (currentFilters.minMileage) {
        filtered = filtered.filter(car => car.mileage !== undefined && car.mileage >= currentFilters.minMileage!);
    }
    if (currentFilters.maxMileage) {
        filtered = filtered.filter(car => car.mileage !== undefined && car.mileage <= currentFilters.maxMileage!);
    }
    if (currentFilters.fuelType && currentFilters.fuelType.length > 0) {
        filtered = filtered.filter(car => car.fuelType && currentFilters.fuelType!.map(ft => ft.toLowerCase()).includes(car.fuelType.toLowerCase()));
    }
    if (currentFilters.colorId && currentFilters.colorId.length > 0) {
        const filterColorsNames = colors.filter(c => currentFilters.colorId!.includes(c.id)).map(c => c.name.toLowerCase());
        if (filterColorsNames.length > 0) {
             filtered = filtered.filter(car => car.color && filterColorsNames.includes(car.color.toLowerCase()));
        }
    }
    if (currentFilters.bodyTypeId && currentFilters.bodyTypeId.length > 0) {
        const filterBodyTypeNames = bodyTypes.filter(bt => currentFilters.bodyTypeId!.includes(bt.id)).map(bt => bt.name.toLowerCase());
        if (filterBodyTypeNames.length > 0) {
            filtered = filtered.filter(car => car.bodyTypeName && filterBodyTypeNames.includes(car.bodyTypeName.toLowerCase()));
        }
    }
    if (currentFilters.transmissionType && currentFilters.transmissionType.length > 0) {
        const filterTransmissionNames = currentFilters.transmissionType.map(t => t.toLowerCase());
        filtered = filtered.filter(car =>
            (car.technicalSpec?.transmissionType && filterTransmissionNames.includes(car.technicalSpec.transmissionType.toLowerCase())) ||
            (car.transmissionInfo && filterTransmissionNames.some(ftn => car.transmissionInfo!.toLowerCase().includes(ftn)))
        );
    }
    if (currentFilters.driveType && currentFilters.driveType.length > 0) {
        const filterDriveNames = currentFilters.driveType.map(d => d.toLowerCase());
        filtered = filtered.filter(car =>
            car.technicalSpec?.driveType && filterDriveNames.includes(car.technicalSpec.driveType.toLowerCase())
        );
    }
    
    const page = currentFilters.page || 0;
    const size = currentFilters.size || 10;
    const paginatedCars = filtered.slice(page * size, (page + 1) * size);
    setCars(paginatedCars);
    setPagination({ page, totalPages: Math.ceil(filtered.length / size), totalElements: filtered.length });
  }, [colors, bodyTypes]); // Added dependencies for colors and bodyTypes

  // Функция для генерации URL заглушки с названием модели
  const generatePlaceholderUrl = (make: string, model: string, year: number): string => {
    // Очищаем и форматируем текст для URL
    const cleanMake = make.replace(/[^\w\s]/gi, '').trim();
    const cleanModel = model.replace(/[^\w\s]/gi, '').trim();
    
    // Создаем текст для заглушки
    const placeholderText = `${cleanMake}+${cleanModel}+${year}`;
    
    // Генерируем случайный цвет фона для разнообразия заглушек
    const colors = ['4285F4', '34A853', 'FBBC05', 'EA4335', '673AB7', '3F51B5', '2196F3', '03A9F4', '00BCD4'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    // Возвращаем URL заглушки с названием модели
    return `https://via.placeholder.com/600x400/${randomColor}/FFFFFF?text=${placeholderText}`;
  };

  const fetchExternalCars = useCallback(async () => {
    setLoading(true);
    setError(null);
    setParserErrorOccurred(false);
    try {
      const parsedData = await parseCars("https://www.avtogermes.ru/second_hand/" );
      const mappedCars: Car[] = parsedData.map((pCar, index) => {
        // Создаем заглушку с названием модели
        const placeholderUrl = generatePlaceholderUrl(
          pCar.make || 'Неизвестно', 
          pCar.model || 'Неизвестно', 
          pCar.year || 0
        );
        
        return {
          id: `ext-${index}-${Date.now()}`,
          make: pCar.make || 'Неизвестно',
          model: pCar.model || 'Неизвестно',
          year: pCar.year || 0,
          price: pCar.price || 0,
          mileage: pCar.mileage,
          fuelType: pCar.engine?.split(',')[0]?.trim(),
          color: pCar.color,
          engineInfo: pCar.engine,
          // Используем заглушку, если imageUrl отсутствует
          mainPhotoUrl: pCar.imageUrl || placeholderUrl,
          // Добавляем массив с заглушками для галереи
          allPhotoUrls: pCar.imageUrl ? [pCar.imageUrl, placeholderUrl] : [placeholderUrl],
          location: pCar.city,
          bodyTypeName: pCar.bodyType, // Assuming parser provides this
          transmissionInfo: pCar.transmission, // Assuming parser provides this
          technicalSpec: {
              fuelType: pCar.engine?.split(',')[0]?.trim() || 'Неизвестно',
              driveType: pCar.drive || 'Неизвестно', // Assuming parser provides this
              transmissionType: pCar.transmission || 'Неизвестно', // Assuming parser provides this
              horsePower: pCar.horsePower,
          }
        };
      });
      setAllExternalCars(mappedCars);
      applyFiltersToExternalCars(mappedCars, filters);
      // Pagination for external cars was already here, it's fine.
    } catch (err) {
      console.error('Ошибка при парсинге автомобилей:', err);
      setError('Не удалось загрузить автомобили с внешнего ресурса. Показываются данные из нашей базы.');
      setParserErrorOccurred(true);
      setActiveDataSource('local'); 
    } finally {
      setLoading(false);
    }
  }, [filters, applyFiltersToExternalCars]);

  useEffect(() => {
    if (activeDataSource === 'local') {
        fetchLocalCars(filters);
    } else if (allExternalCars.length > 0) { // If external cars already fetched, just re-apply filters
        applyFiltersToExternalCars(allExternalCars, filters);
    } else { // Fetch external if not already fetched
        fetchExternalCars();
    }
  }, [filters, activeDataSource, fetchLocalCars, fetchExternalCars, allExternalCars, applyFiltersToExternalCars]);

  const handleFilterChange = (name: string, value: any) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value,
      page: 0, 
    }));
  };

  const handleApplyFilters = () => { // This function might become redundant if filters apply on change
    if (activeDataSource === 'local') {
      fetchLocalCars(filters);
    } else {
      // applyFiltersToExternalCars is called via useEffect when filters change
      // but if we want an explicit apply button:
      applyFiltersToExternalCars(allExternalCars, filters);
    }
  };

  const handleResetFilters = () => {
    const defaultFilters: CarFilter = {
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
    };
    setFilters(defaultFilters);
    // Data will be refetched/refiltered by the useEffect hook watching 'filters'
  };

  const handleDataSourceChange = (source: 'local' | 'external') => {
    setActiveDataSource(source);
    // Data fetching/filtering will be handled by the useEffect watching 'activeDataSource' and 'filters'
  };

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

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Обработчики для модального окна подробного просмотра
  const handleShowDetails = (car: Car) => {
    // Сначала сбрасываем индекс фото, затем устанавливаем выбранную машину
    setCurrentPhotoIndex(0);
    setSelectedCar(car);
    setShowModal(true);
    document.body.style.overflow = 'hidden'; // Запрещаем прокрутку фона
  };

  const handleCloseModal = () => {
    setShowModal(false);
    document.body.style.overflow = ''; // Возвращаем прокрутку
  };

  // Обработчики для полноэкранного режима просмотра фотографий
  const handleOpenFullscreen = (car: Car, index: number = 0, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    // Сначала сбрасываем индекс фото, затем устанавливаем выбранную машину
    setFullscreenPhotoIndex(index);
    setFullscreenCar(car);
    setFullscreenMode(true);
    document.body.style.overflow = 'hidden'; // Запрещаем прокрутку фона
  };

  const handleCloseFullscreen = () => {
    setFullscreenMode(false);
    setTimeout(() => {
      setFullscreenCar(null);
      document.body.style.overflow = ''; // Возвращаем прокрутку
    }, 300); // Задержка для анимации
  };

  const handleFullscreenBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCloseFullscreen();
    }
  };

  const handleChangeFullscreenPhoto = (newIndex: number) => {
    setIsPhotoChanging(true);
    setTimeout(() => {
      setFullscreenPhotoIndex(newIndex);
      setIsPhotoChanging(false);
    }, 200);
  };

  // Обработчики для навигации по фотографиям
  const nextPhoto = () => {
    if (selectedCar && selectedCar.allPhotoUrls && selectedCar.allPhotoUrls.length > 0) {
      setCurrentPhotoIndex((prevIndex) => (prevIndex + 1) % selectedCar.allPhotoUrls!.length);
    }
  };

  const prevPhoto = () => {
    if (selectedCar && selectedCar.allPhotoUrls && selectedCar.allPhotoUrls.length > 0) {
      setCurrentPhotoIndex((prevIndex) => (prevIndex - 1 + selectedCar.allPhotoUrls!.length) % selectedCar.allPhotoUrls!.length);
    }
  };

  // Обработчики для наведения на изображения
  const handleImageMouseEnter = (car: Car) => {
    setHoveredCarId(car.id);
    setIsHovering(true);
  };

  const handleImageMouseLeave = () => {
    setIsHovering(false);
  };

  const handleImageMouseMove = (e: React.MouseEvent, car: Car) => {
    if (!car.allPhotoUrls || car.allPhotoUrls.length <= 1) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const percentage = x / width;
    const photoIndex = Math.min(
      Math.floor(percentage * car.allPhotoUrls.length),
      car.allPhotoUrls.length - 1
    );
    setHoveredPhotoIndex(photoIndex);
  };

  useEffect(() => {
    const handleClickOutsideDropdown = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutsideDropdown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideDropdown);
    };
  }, []);

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
        // Прокрутка вверх - предыдущее фото
        const newIndex = fullscreenPhotoIndex === 0 
          ? fullscreenCar.allPhotoUrls.length - 1 
          : fullscreenPhotoIndex - 1;
        handleChangeFullscreenPhoto(newIndex);
      } else if (e.key === 'ArrowDown' && fullscreenCar.allPhotoUrls.length > 1) {
        // Прокрутка вниз - следующее фото
        const newIndex = fullscreenPhotoIndex === fullscreenCar.allPhotoUrls.length - 1 
          ? 0 
          : fullscreenPhotoIndex + 1;
        handleChangeFullscreenPhoto(newIndex);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenMode, fullscreenCar, fullscreenPhotoIndex]);

  const applySorting = (sortBy: string, sortDirection: string) => {
    const newFilters = { ...filters, sortBy, sortDirection, page: 0 };
    setFilters(newFilters);
    setShowSortDropdown(false);
    // Data will be refetched/refiltered by the useEffect hook watching 'filters'
  };

  return (
    <div className="container-fluid mt-3">
      <div className="row">
        <div className="col-lg-12">
          {activeDataSource === 'local' && (
            <Filter
              filters={filters}
              makes={makes}
              models={models} // Now dynamically populated

              // modelsLoading={modelsLoading} // Pass loading state for models
              bodyTypes={bodyTypes}
              colors={colors}
              fuelTypes={fuelTypes}
              transmissionTypes={transmissionTypes}
              driveTypes={driveTypes}
              onFilterChange={handleFilterChange}
              onApply={handleApplyFilters} // Kept for explicit apply, though useEffect also works
              onReset={handleResetFilters} selectedMake={''} onChange={function (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>): void {
                throw new Error('Function not implemented.');
              } }            />
          )}
        </div>
        <div className="col-lg-12">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <button 
                className={`btn btn-sm ${activeDataSource === 'local' ? 'btn-primary' : 'btn-outline-primary'} me-2`}
                onClick={() => handleDataSourceChange('local')}
              >
                Наша база
              </button>
              <button 
                className={`btn btn-sm ${activeDataSource === 'external' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => handleDataSourceChange('external')}
              >
                <img className='fs-1' src='https://www.avtogermes.ru/img/svg/ag_logo_color.svg'></img>
                avtogermes
              </button>
            </div>
            <div className="d-flex align-items-center">
                <div className="me-2">
                    <button className={`btn btn-sm ${viewMode === 'list' ? 'btn-secondary' : 'btn-outline-secondary'} me-1`} onClick={() => setViewMode('list')}><i className="bi bi-list-ul"></i></button>
                    <button className={`btn btn-sm ${viewMode === 'grid' ? 'btn-secondary' : 'btn-outline-secondary'}`} onClick={() => setViewMode('grid')}><i className="bi bi-grid-3x3-gap-fill"></i></button>
                </div>
                <div className="position-relative" ref={sortDropdownRef}>
                    <button className="btn btn-sm btn-outline-secondary dropdown-toggle" onClick={() => setShowSortDropdown(!showSortDropdown)}>
                        Сортировка: {filters.sortBy === 'createdAt' ? 'По дате' : filters.sortBy === 'price' ? 'По цене' : 'По релевантности'} ({filters.sortDirection === 'ASC' ? 'возр.' : 'убыв.'})
                    </button>
                    {showSortDropdown && (
                        <ul className="dropdown-menu show position-absolute end-0" style={{ zIndex: 1050 }}>
                            <li><button className="dropdown-item" onClick={() => applySorting('createdAt', 'DESC')}>По дате (сначала новые)</button></li>
                            <li><button className="dropdown-item" onClick={() => applySorting('createdAt', 'ASC')}>По дате (сначала старые)</button></li>
                            <li><button className="dropdown-item" onClick={() => applySorting('price', 'ASC')}>По цене (сначала дешевые)</button></li>
                            <li><button className="dropdown-item" onClick={() => applySorting('price', 'DESC')}>По цене (сначала дорогие)</button></li>
                        </ul>
                    )}
                </div>
            </div>
          </div>

          {loading && <div className="text-center"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></div>}
          {error && <div className="alert alert-danger">{error}</div>}
          
          {!loading && !error && cars.length === 0 && <div className="alert alert-info">По вашему запросу ничего не найдено.</div>}

          {viewMode === 'list' && (
             <div className="list-view">
                {cars.map(car => (
                    <div key={car.id} className="card mb-3 car-card-list" onClick={() => handleShowDetails(car)}>
                        <div className="row g-0">
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
                                        : (car.mainPhotoUrl || 'https://via.placeholder.com/300x200.png?text=No+Image')
                                    } 
                                    className="img-fluid rounded-start car-image-list" 
                                    alt={`${car.make} ${car.model}`} 
                                    style={{ 
                                      objectFit: 'cover',
                                      width: '100%',
                                      height: '100%',
                                      minHeight: '220px',
                                      maxHeight: '220px',
                                      transition: 'all 0.3s ease',
                                      cursor: 'pointer'
                                    }}
                                    onError={(e) => {
                                      // Обработка ошибки загрузки изображения
                                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200.png?text=Ошибка+загрузки';
                                    }}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
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
                                </div>
                            </div>
                            <div className="col-md-8">
                                <div className="card-body">
                                    <h5 className="card-title">{car.make} {car.model} ({car.year})</h5>
                                    <p className="card-text"><strong>Цена: {car.price.toLocaleString()} ₽</strong></p>
                                    {car.mileage !== undefined && <p className="card-text"><small className="text-muted">Пробег: {car.mileage.toLocaleString()} км</small></p>}
                                    {car.engineInfo && <p className="card-text"><small className="text-muted">Двигатель: {car.engineInfo}</small></p>}
                                    {car.location && <p className="card-text"><small className="text-muted">Город: {car.location}</small></p>}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          )}

          {viewMode === 'grid' && (
            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 grid-view">
                {cars.map(car => (
                    <div key={car.id} className="col">
                        <div className="card h-100 car-card-grid" onClick={() => handleShowDetails(car)}>
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
                                    : (car.mainPhotoUrl || 'https://via.placeholder.com/300x200.png?text=No+Image')
                                } 
                                className="card-img-top car-image-grid" 
                                alt={`${car.make} ${car.model}`} 
                                style={{ 
                                  objectFit: 'cover',
                                  height: '200px',
                                  transition: 'all 0.3s ease'
                                }}
                                onError={(e) => {
                                  // Обработка ошибки загрузки изображения
                                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200.png?text=Ошибка+загрузки';
                                }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
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
                            </div>
                            <div className="card-body">
                                <h5 className="card-title">{car.make} {car.model} ({car.year})</h5>
                                <p className="card-text"><strong>{car.price.toLocaleString()} ₽</strong></p>
                                {car.mileage !== undefined && <p className="card-text"><small className="text-muted">{car.mileage.toLocaleString()} км</small></p>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          )}

          {!loading && pagination.totalPages > 1 && (
            <nav aria-label="Page navigation" className="mt-4 d-flex justify-content-center">
              <ul className="pagination">
                <li className={`page-item ${pagination.page === 0 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setFilters(f => ({...f, page: f.page! - 1}))}>Предыдущая</button>
                </li>
                {[...Array(pagination.totalPages).keys()].map(num => (
                  <li key={num} className={`page-item ${pagination.page === num ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setFilters(f => ({...f, page: num}))}>{num + 1}</button>
                  </li>
                ))}
                <li className={`page-item ${pagination.page === pagination.totalPages - 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setFilters(f => ({...f, page: f.page! + 1}))}>Следующая</button>
                </li>
              </ul>
            </nav>
          )}
        </div>
      </div>

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
                        background: 'linear-gradient(135deg, var(--bs-primary), var(--bs-primary-light, #0d6efd))',
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
                      <div className="col-lg-12 position-relative car-img-container">
                        <img 
                          src={selectedCar.allPhotoUrls && selectedCar.allPhotoUrls.length > 0 && currentPhotoIndex < selectedCar.allPhotoUrls.length
                              ? selectedCar.allPhotoUrls[currentPhotoIndex] 
                              : (selectedCar.mainPhotoUrl || generatePlaceholderUrl(selectedCar.make, selectedCar.model, selectedCar.year))} 
                          className="img-fluid" 
                          alt={`${selectedCar.make} ${selectedCar.model}`} 
                          style={{ 
                            height: '400px', 
                            width: '100%', 
                            objectFit: 'contain',
                            cursor: 'pointer' // Добавляем указатель для улучшения UX
                          }}
                          onError={(e) => {
                            // Обработка ошибки загрузки изображения - используем заглушку с названием модели
                            (e.target as HTMLImageElement).src = generatePlaceholderUrl(selectedCar.make, selectedCar.model, selectedCar.year);
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
                              onClick={(e) => {
                                e.stopPropagation();
                                prevPhoto();
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
                              onClick={(e) => {
                                e.stopPropagation();
                                nextPhoto();
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenFullscreen(selectedCar, currentPhotoIndex);
                          }}
                        >
                          <i className="bi bi-arrows-fullscreen me-1"></i> Полный экран
                        </button>
                        
                        {/* Значок состояния автомобиля */}
                        {selectedCar.condition && (
                          <div className="position-absolute top-0 start-0 m-3">
                            <div className="badge py-2 px-3 rounded-pill" style={{ 
                              backgroundColor: selectedCar.condition === 'Новое' ? 'var(--bs-success)' : selectedCar.condition === 'Отличное' ? 'var(--bs-primary)' : 'rgba(108, 117, 125, 0.9)',
                              color: 'white',
                              fontSize: '0.85rem',
                              fontWeight: '500',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                            }}>
                              <i className={`bi ${selectedCar.condition === 'Новое' ? 'bi-patch-check' : 'bi-speedometer'} me-1`}></i>
                              {selectedCar.condition}
                            </div>
                          </div>
                        )}
                        
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
                                    onError={(e) => {
                                      // Обработка ошибки загрузки миниатюры
                                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80x60?text=Ошибка';
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
                      <div className="col-lg-11 p-4">
                        <div className="modal-animation-container">
                          {/* Цена с анимацией */}
                          <div className="price-block mb-4">
                            <div className="fs-4 fw-bold price-pulse m-2" style={{ color: 'var(--bs-primary)'}}>
                              {selectedCar.price.toLocaleString()} ₽
                            </div>
                            {selectedCar.createdAt && (
                              <div className="text-muted small">
                                <i className="bi bi-calendar3 me-1"></i> Размещено: {new Date(selectedCar.createdAt).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          
                          {/* Локация */}
                          {selectedCar.location && (
                            <div className="location-block mb-4 p-3 rounded-3" style={{ 
                              backgroundColor: 'rgba(249, 199, 132, 0.15)',
                              border: '1px solid rgba(249, 199, 132, 0.3)'
                            }}>
                              <h6 className="fw-bold mb-2 d-flex align-items-center">
                                <i className="bi bi-geo-alt me-2" style={{ color: 'var(--bs-primary)' }}></i>
                                Местоположение
                              </h6>
                              <div className="d-flex align-items-center">
                                <span>{selectedCar.location}</span>
                              </div>
                            </div>
                          )}
                          
                          {/* Основные характеристики */}
                          <div className="specs-highlight mb-4">
                            <h6 className="fw-bold mb-3 d-flex align-items-center">
                              <i className="bi bi-info-circle me-2" style={{ color: 'var(--bs-primary)' }}></i>
                              Основные характеристики
                            </h6>
                            <div className="row g-3">
                              {selectedCar.year && (
                                <div className="col-6">
                                  <div className="spec-item p-3 rounded-3 h-100" style={{ backgroundColor: 'rgba(53, 99, 233, 0.1)' }}>
                                    <div className="spec-title small text-muted mb-1">Год выпуска</div>
                                    <div className="spec-value fw-medium">{selectedCar.year}</div>
                                  </div>
                                </div>
                              )}
                              {selectedCar.mileage !== undefined && (
                                <div className="col-6">
                                  <div className="spec-item p-3 rounded-3 h-100" style={{ backgroundColor: 'rgba(53, 99, 233, 0.1)' }}>
                                    <div className="spec-title small text-muted mb-1">Пробег</div>
                                    <div className="spec-value fw-medium">{selectedCar.mileage.toLocaleString()} км</div>
                                  </div>
                                </div>
                              )}
                              {selectedCar.bodyTypeName && (
                                <div className="col-6">
                                  <div className="spec-item p-3 rounded-3 h-100" style={{ backgroundColor: 'rgba(53, 99, 233, 0.1)' }}>
                                    <div className="spec-title small text-muted mb-1">Кузов</div>
                                    <div className="spec-value fw-medium">{selectedCar.bodyTypeName}</div>
                                  </div>
                                </div>
                              )}
                              {selectedCar.colorName && (
                                <div className="col-6">
                                  <div className="spec-item p-3 rounded-3 h-100" style={{ backgroundColor: 'rgba(53, 99, 233, 0.1)' }}>
                                    <div className="spec-title small text-muted mb-1">Цвет</div>
                                    <div className="spec-value fw-medium">{selectedCar.colorName}</div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Технические характеристики */}
                          <div className="tech-specs mb-4">
                            <h6 className="fw-bold mb-3 d-flex align-items-center">
                              <i className="bi bi-gear me-2" style={{ color: 'var(--bs-primary)' }}></i>
                              Технические характеристики
                            </h6>
                            <ul className="list-group list-group-flush">
                              {selectedCar.engineInfo && (
                                <li className="list-group-item px-0 py-2 d-flex justify-content-between align-items-center border-dashed">
                                  <span className="text-muted">Двигатель:</span>
                                  <span className="fw-medium">{selectedCar.engineInfo}</span>
                                </li>
                              )}
                              {selectedCar.technicalSpec?.horsePower && (
                                <li className="list-group-item px-0 py-2 d-flex justify-content-between align-items-center border-dashed">
                                  <span className="text-muted">Мощность:</span>
                                  <span className="fw-medium">{selectedCar.technicalSpec.horsePower} л.с.</span>
                                </li>
                              )}
                              {selectedCar.transmissionInfo && (
                                <li className="list-group-item px-0 py-2 d-flex justify-content-between align-items-center border-dashed">
                                  <span className="text-muted">Коробка:</span>
                                  <span className="fw-medium">{selectedCar.transmissionInfo}</span>
                                </li>
                              )}
                              {selectedCar.technicalSpec?.driveType && selectedCar.technicalSpec.driveType !== 'Неизвестно' && (
                                <li className="list-group-item px-0 py-2 d-flex justify-content-between align-items-center border-dashed">
                                  <span className="text-muted">Привод:</span>
                                  <span className="fw-medium">{selectedCar.technicalSpec.driveType}</span>
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Дополнительная информация */}
                  <div className="additional-info p-4">
                    {/* Безопасность */}
                    {selectedCar.safetyFeatures && selectedCar.safetyFeatures.length > 0 && (
                      <div className="safety-features mb-4">
                        <h5 className="fw-bold mb-3 d-flex align-items-center">
                          <span className="icon-wrapper me-2 d-inline-flex align-items-center justify-content-center rounded-circle p-2" style={{ 
                            backgroundColor: 'rgba(48, 175, 91, 0.1)'
                          }}>
                            <i className="bi bi-shield-check" style={{ color: 'var(--bs-success)' }}></i>
                          </span>
                          Безопасность
                        </h5>
                        <div className="d-flex flex-wrap gap-2 badge-animation-container">
                          {selectedCar.safetyFeatures.map((item, index) => (
                            <span 
                              key={index} 
                              className="badge rounded-pill py-2 px-3" 
                              style={{ 
                                backgroundColor: 'rgba(48, 175, 91, 0.1)', 
                                color: 'var(--bs-success)',
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
                    
                    {/* Комплектация */}
                    {selectedCar.equipment && selectedCar.equipment.length > 0 && (
                      <div className="equipment mb-4">
                        <h5 className="fw-bold mb-3 d-flex align-items-center">
                          <span className="icon-wrapper me-2 d-inline-flex align-items-center justify-content-center rounded-circle p-2" style={{ 
                            backgroundColor: 'rgba(53, 99, 233, 0.1)'
                          }}>
                            <i className="bi bi-list-check" style={{ color: 'var(--bs-primary)' }}></i>
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
                                color: 'var(--bs-success)',
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
                <div className="modal-footer justify-content-between border-0 bg-light p-3">
                  <span className="small text-muted d-flex align-items-center">
                    <i className="bi bi-info-circle me-1"></i> ID автомобиля: {selectedCar.id}
                  </span>
                  <button 
                    type="button" 
                    className="btn btn-sm rounded-pill px-3 py-2" 
                    style={{ 
                      backgroundColor: 'var(--bs-primary)',
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
          
          .border-dashed {
            border-bottom-style: dashed !important;
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
          onClick={handleFullscreenBackgroundClick}
        >
          {/* Контейнер для фотографии */}
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
            {/* Основное фото */}
            <div 
              className="main-photo-container d-flex align-items-center justify-content-center"
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
                  backgroundImage: fullscreenCar.allPhotoUrls && fullscreenCar.allPhotoUrls.length > 0 && fullscreenPhotoIndex < fullscreenCar.allPhotoUrls.length
                    ? `url(${fullscreenCar.allPhotoUrls[fullscreenPhotoIndex]})` 
                    : fullscreenCar.mainPhotoUrl ? `url(${fullscreenCar.mainPhotoUrl})` : `url(${generatePlaceholderUrl(fullscreenCar.make, fullscreenCar.model, fullscreenCar.year)})`,
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
              
              {/* Основное фото */}
              <div 
                className={`main-photo ${isPhotoChanging ? 'changing' : ''}`}
                style={{
                  maxWidth: '90%',
                  maxHeight: '90%',
                  transition: 'opacity 0.2s ease',
                  opacity: isPhotoChanging ? 0 : 1
                }}
              >
                <img 
                  src={fullscreenCar.allPhotoUrls && fullscreenCar.allPhotoUrls.length > 0 && fullscreenPhotoIndex < fullscreenCar.allPhotoUrls.length
                      ? fullscreenCar.allPhotoUrls[fullscreenPhotoIndex] 
                      : (fullscreenCar.mainPhotoUrl || generatePlaceholderUrl(fullscreenCar.make, fullscreenCar.model, fullscreenCar.year))} 
                  alt={`${fullscreenCar.make} ${fullscreenCar.model} - фото ${fullscreenPhotoIndex + 1}`}
                  style={{
                      maxWidth: '100%',
                      maxHeight: '85vh',
                      objectFit: 'contain',
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                      borderRadius: '4px'
                  }}
                  onError={(e) => {
                    // Обработка ошибки загрузки изображения - используем заглушку с названием модели
                    (e.target as HTMLImageElement).src = generatePlaceholderUrl(fullscreenCar.make, fullscreenCar.model, fullscreenCar.year);
                  }}
                />
                
                {/* Индикатор номера фотографии */}
                {fullscreenCar.allPhotoUrls && fullscreenCar.allPhotoUrls.length > 1 && (
                  <div 
                    className="photo-counter position-absolute bottom-0 start-50 translate-middle-x mb-4 px-3 py-2 rounded-pill"
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      fontSize: '0.9rem',
                      backdropFilter: 'blur(4px)'
                    }}
                  >
                    {fullscreenPhotoIndex + 1} / {fullscreenCar.allPhotoUrls.length}
                  </div>
                )}
              </div>
              
              {/* Кнопки навигации */}
              {fullscreenCar.allPhotoUrls && fullscreenCar.allPhotoUrls.length > 1 && (
                <>
                  <button 
                    className="nav-button prev position-absolute top-50 start-0 translate-middle-y ms-4"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '50px',
                      height: '50px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      backdropFilter: 'blur(4px)'
                    }}
                    onClick={() => {
                      const newIndex = fullscreenPhotoIndex === 0 
                        ? fullscreenCar.allPhotoUrls!.length - 1 
                        : fullscreenPhotoIndex - 1;
                      handleChangeFullscreenPhoto(newIndex);
                    }}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  <button 
                    className="nav-button next position-absolute top-50 end-0 translate-middle-y me-4"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '50px',
                      height: '50px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      backdropFilter: 'blur(4px)'
                    }}
                    onClick={() => {
                      const newIndex = fullscreenPhotoIndex === fullscreenCar.allPhotoUrls!.length - 1 
                        ? 0 
                        : fullscreenPhotoIndex + 1;
                      handleChangeFullscreenPhoto(newIndex);
                    }}
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </>
              )}
              
              {/* Кнопка закрытия */}
              <button 
                className="close-button position-absolute top-0 end-0 m-4"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(4px)'
                }}
                onClick={handleCloseFullscreen}
              >
                <i className="bi bi-x-lg"></i>
              </button>
              
              {/* Информация об автомобиле */}
              <div 
                className="car-info position-absolute top-0 start-0 m-4 p-3 rounded"
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  maxWidth: '300px',
                  backdropFilter: 'blur(4px)'
                }}
              >
                <h5 className="mb-1">{fullscreenCar.make} {fullscreenCar.model}</h5>
                <p className="mb-0 small">{fullscreenCar.year} г., {fullscreenCar.price.toLocaleString()} ₽</p>
              </div>
              
              {/* Миниатюры фотографий внизу */}
              {fullscreenCar.allPhotoUrls && fullscreenCar.allPhotoUrls.length > 1 && (
                <div 
                  className="thumbnails-container position-absolute bottom-0 start-0 w-100 py-3 px-4"
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    overflowX: 'auto',
                    whiteSpace: 'nowrap',
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  <div className="d-flex gap-2 justify-content-center">
                    {fullscreenCar.allPhotoUrls.map((url, index) => (
                      <div 
                        key={index} 
                        className="thumbnail-item"
                        style={{
                          width: '80px',
                          height: '60px',
                          flexShrink: 0,
                          cursor: 'pointer',
                          border: fullscreenPhotoIndex === index ? '2px solid var(--bs-primary)' : '1px solid rgba(255, 255, 255, 0.3)',
                          borderRadius: '4px',
                          transition: 'all 0.2s ease',
                          transform: fullscreenPhotoIndex === index ? 'scale(1.1)' : 'scale(1)',
                          opacity: fullscreenPhotoIndex === index ? 1 : 0.6
                        }}
                        onClick={() => handleChangeFullscreenPhoto(index)}
                      >
                        <img 
                          src={url} 
                          alt={`Миниатюра ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '3px'
                          }}
                          onError={(e) => {
                            // Обработка ошибки загрузки миниатюры
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80x60?text=Ошибка';
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {showScrollButton && <button onClick={scrollToTop} className="btn btn-primary position-fixed bottom-0 end-0 m-3" style={{zIndex: 1050}}><i className="bi bi-arrow-up"></i></button>}
    </div>
  );
};

export default MainContainer;
