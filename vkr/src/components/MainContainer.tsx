import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import Filter from './Filter';
import OrderModal from './OrderModal'; // Импортируем новый компонент
import { useAuth } from '../firebase/AuthContext'; // Импортируем хук аутентификации

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
  const API_URL = 'http://localhost:8080/api';
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

  // Состояние для модального окна заказа (НОВОЕ)
  const [showOrderModal, setShowOrderModal] = useState<boolean>(false);
  const [orderCar, setOrderCar] = useState<Car | null>(null);

  // Получаем информацию о текущем пользователе (НОВОЕ)
  const { currentUser } = useAuth();

  // Функция для обработки клика по кнопке "Заказать" (НОВОЕ)
  const handleOrderClick = (e: React.MouseEvent, car: Car) => {
    e.stopPropagation(); // Предотвращаем всплытие события, чтобы не открывалась карточка авто
    setOrderCar(car);
    setShowOrderModal(true);
  };

  // Функции для загрузки справочников
  const fetchBodyTypes = useCallback(async () => {
    try {
      const response = await axios.get<ApiResponse<BodyType[]>>(`${API_URL}/dictionary/body-types`);
      setBodyTypes(response.data?.data || response.data?.content || []);
    } catch (error) {
      console.error("Error fetching body types:", error);
      setBodyTypes([{ id: 1, name: "Седан" }]); // Fallback data
    }
  }, [API_URL]);

  const fetchColors = useCallback(async () => {
    try {
      const response = await axios.get<ApiResponse<Color[]>>(`${API_URL}/dictionary/colors`);
      setColors(response.data?.data || response.data?.content || []);
    } catch (error) {
      console.error("Error fetching colors:", error);
      setColors([{ id: 1, name: "Черный", hexCode: "#000000" }]); // Fallback data
    }
  }, [API_URL]);

  const fetchMakes = useCallback(async () => {
    try {
      const response = await axios.get<ApiResponse<string[]>>(`${API_URL}/cars/makes`);
      const data = response.data?.data || response.data?.content;
      if (Array.isArray(data)) {
        setMakes(data.filter(item => typeof item === 'string' && item.trim().length > 0).sort());
      } else {
        setMakes([]);
      }
    } catch (error) {
      console.error("Error fetching makes:", error);
      setMakes(["Toyota", "BMW", "Mercedes-Benz"].sort()); // Fallback data
    }
  }, [API_URL]);

  const fetchFuelTypes = useCallback(async () => {
    try {
      const response = await axios.get<ApiResponse<string[]>>(`${API_URL}/dictionary/fuel-types`);
      const data = response.data?.data || response.data?.content;
      if (Array.isArray(data)) {
        setFuelTypes(data.filter(item => typeof item === 'string' && item.trim().length > 0).sort());
      } else {
        setFuelTypes([]);
      }
    } catch (error) {
      console.error("Error fetching fuel types:", error);
      setFuelTypes(["Бензин", "Дизель"].sort()); // Fallback data
    }
  }, [API_URL]);

  const fetchTransmissionTypes = useCallback(async () => {
    try {
      const response = await axios.get<ApiResponse<string[]>>(`${API_URL}/dictionary/transmission-types`);
      const data = response.data?.data || response.data?.content;
      if (Array.isArray(data)) {
        setTransmissionTypes(data.filter(item => typeof item === 'string' && item.trim().length > 0).sort());
      } else {
        setTransmissionTypes([]);
      }
    } catch (error) {
      console.error("Error fetching transmission types:", error);
      setTransmissionTypes(["Автоматическая", "Механическая"].sort()); // Fallback data
    }
  }, [API_URL]);

  const fetchDriveTypes = useCallback(async () => {
    try {
      const response = await axios.get<ApiResponse<string[]>>(`${API_URL}/dictionary/drive-types`);
      const data = response.data?.data || response.data?.content;
      if (Array.isArray(data)) {
        setDriveTypes(data.filter(item => typeof item === 'string' && item.trim().length > 0).sort());
      } else {
        setDriveTypes([]);
      }
    } catch (error) {
      console.error("Error fetching drive types:", error);
      setDriveTypes(["Передний", "Задний"].sort()); // Fallback data
    }
  }, [API_URL]);

  // Загрузка справочников при монтировании компонента
  useEffect(() => {
    const fetchDictionaries = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchBodyTypes(),
          fetchColors(),
          fetchMakes(),
          fetchFuelTypes(),
          fetchTransmissionTypes(),
          fetchDriveTypes()
        ]);
      } catch (err) {
        console.error('Ошибка при загрузке справочников:', err);
        setError('Не удалось загрузить справочные данные');
      } finally {
        setLoading(false);
      }
    };
    fetchDictionaries();
  }, [fetchBodyTypes, fetchColors, fetchMakes, fetchFuelTypes, fetchTransmissionTypes, fetchDriveTypes]);

  // Загрузка моделей при изменении выбранной марки
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
        setModels([]); // Clear models if no make is selected
      }
    };
    fetchModelsForSelectedMakes();
  }, [filters.make, API_URL]);

  // Загрузка автомобилей
  const fetchCars = useCallback(async (filterParams: CarFilter = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      // Формируем параметры запроса
      const params = new URLSearchParams();
      
      // Добавляем параметры фильтрации
      if (filterParams.make && filterParams.make.length > 0) {
        filterParams.make.forEach(make => params.append('make', make));
      }
      
      if (filterParams.model && filterParams.model.length > 0) {
        filterParams.model.forEach(model => params.append('model', model));
      }
      
      if (filterParams.minYear) params.append('minYear', filterParams.minYear.toString());
      if (filterParams.maxYear) params.append('maxYear', filterParams.maxYear.toString());
      if (filterParams.minPrice) params.append('minPrice', filterParams.minPrice.toString());
      if (filterParams.maxPrice) params.append('maxPrice', filterParams.maxPrice.toString());
      if (filterParams.minMileage) params.append('minMileage', filterParams.minMileage.toString());
      if (filterParams.maxMileage) params.append('maxMileage', filterParams.maxMileage.toString());
      
      if (filterParams.bodyTypeId && filterParams.bodyTypeId.length > 0) {
        filterParams.bodyTypeId.forEach(id => params.append('bodyTypeId', id.toString()));
      }
      
      if (filterParams.fuelType && filterParams.fuelType.length > 0) {
        filterParams.fuelType.forEach(type => params.append('fuelType', type));
      }
      
      if (filterParams.transmissionType && filterParams.transmissionType.length > 0) {
        filterParams.transmissionType.forEach(type => params.append('transmissionType', type));
      }
      
      if (filterParams.driveType && filterParams.driveType.length > 0) {
        filterParams.driveType.forEach(type => params.append('driveType', type));
      }
      
      if (filterParams.colorId && filterParams.colorId.length > 0) {
        filterParams.colorId.forEach(id => params.append('colorId', id.toString()));
      }
      
      // Добавляем параметры пагинации и сортировки
      params.append('page', (filterParams.page || 0).toString());
      params.append('size', (filterParams.size || 10).toString());
      params.append('sortBy', filterParams.sortBy || 'createdAt');
      params.append('sortDirection', filterParams.sortDirection || 'DESC');
      
      // Выполняем запрос
      const response = await axios.get<ApiResponse<Car[]>>(`${API_URL}/cars`, { params });
      
      // Обрабатываем ответ
      const responseData = response.data?.data || response.data?.content;
      if (Array.isArray(responseData)) {
        setCars(responseData);
        setPagination({
          page: response.data?.number || 0,
          totalPages: response.data?.totalPages || 0,
          totalElements: response.data?.totalElements || 0,
        });
      } else {
        console.error('Получены некорректные данные для автомобилей:', response.data);
        setCars([]);
        setPagination({ page: 0, totalPages: 0, totalElements: 0 });
      }
    } catch (err) {
      console.error('Ошибка при загрузке автомобилей:', err);
      setError('Не удалось загрузить список автомобилей');
      setCars([]);
      setPagination({ page: 0, totalPages: 0, totalElements: 0 });
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Загрузка внешних автомобилей
  const fetchExternalCars = useCallback(async () => {
    setLoading(true);
    setError(null);
    setParserErrorOccurred(false);
    try {
      const response = await axios.get<Car[]>('/kolesa_parsed_cars.json');
      setAllExternalCars(response.data || []);
    } catch (err) {
      console.error('Ошибка при загрузке внешних автомобилей:', err);
      setError('Не удалось загрузить данные с внешнего источника');
      setAllExternalCars([]);
      setParserErrorOccurred(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Первоначальная загрузка данных
  useEffect(() => {
    if (activeDataSource === 'local') {
      fetchCars(filters);
    } else {
      fetchExternalCars();
    }
  }, [fetchCars, fetchExternalCars, filters, activeDataSource]);

  // Обработчики событий
  const handleFilterChange = (name: string, value: any) => {
    setFilters(prev => {
      const newFilter = { ...prev, [name]: value, page: 0 }; // Reset page on filter change
      // Reset model if make is changed
      if (name === 'make') {
        newFilter.model = [];
      }
      return newFilter;
    });
  };

  const handleApplyFilters = () => {
    if (activeDataSource === 'local') {
      fetchCars(filters);
    }
    // For external data source, filtering is handled client-side in renderCars
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
    if (activeDataSource === 'local') {
      fetchCars(defaultFilters);
    }
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleSortChange = (sortBy: string, sortDirection: string) => {
    setFilters(prev => ({ ...prev, sortBy, sortDirection, page: 0 }));
    setShowSortDropdown(false);
  };

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
  };

  const handleDataSourceChange = (source: 'local' | 'external') => {
    setActiveDataSource(source);
  };

  const handleCarClick = (car: Car) => {
    setSelectedCar(car);
    setCurrentPhotoIndex(0);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCar(null);
  };

  const handlePhotoChange = (direction: 'prev' | 'next') => {
    if (!selectedCar || !selectedCar.allPhotoUrls || selectedCar.allPhotoUrls.length <= 1) return;
    const totalPhotos = selectedCar.allPhotoUrls.length;
    let newIndex = currentPhotoIndex;
    if (direction === 'prev') {
      newIndex = (currentPhotoIndex - 1 + totalPhotos) % totalPhotos;
    } else {
      newIndex = (currentPhotoIndex + 1) % totalPhotos;
    }
    setCurrentPhotoIndex(newIndex);
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentPhotoIndex(index);
  };

  const handlePhotoClick = (car: Car, index: number) => {
    setFullscreenCar(car);
    setFullscreenPhotoIndex(index);
    setFullscreenMode(true);
  };

  const handleCloseFullscreen = () => {
    setFullscreenMode(false);
    setFullscreenCar(null);
  };

  const handleChangeFullscreenPhoto = (newIndex: number) => {
    if (!fullscreenCar || !fullscreenCar.allPhotoUrls) return;
    setIsPhotoChanging(true);
    setFullscreenPhotoIndex(newIndex);
    // Allow time for fade effect
    setTimeout(() => setIsPhotoChanging(false), 150);
  };

  const handleMouseEnterPhoto = (carId: number | string) => {
    setHoveredCarId(carId);
    setIsHovering(true);
  };

  const handleMouseLeavePhoto = () => {
    setIsHovering(false);
    // Delay hiding to allow moving to arrows
    setTimeout(() => {
      if (!isHovering) {
        setHoveredCarId(null);
        setHoveredPhotoIndex(0);
      }
    }, 100);
  };

  const handlePhotoArrowClick = (e: React.MouseEvent, direction: 'prev' | 'next', car: Car) => {
    e.stopPropagation();
    if (!car.allPhotoUrls || car.allPhotoUrls.length <= 1) return;
    const totalPhotos = car.allPhotoUrls.length;
    let newIndex = hoveredPhotoIndex;
    if (direction === 'prev') {
      newIndex = (hoveredPhotoIndex - 1 + totalPhotos) % totalPhotos;
    } else {
      newIndex = (hoveredPhotoIndex + 1) % totalPhotos;
    }
    setHoveredPhotoIndex(newIndex);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Рендеринг автомобилей
  const renderCars = () => {
    let carsToRender: Car[] = [];

    if (activeDataSource === 'local') {
      carsToRender = cars;
    } else {
      // Client-side filtering for external cars
      carsToRender = allExternalCars.filter(car => {
        if (filters.make && filters.make.length > 0 && !filters.make.includes(car.make)) return false;
        if (filters.model && filters.model.length > 0 && !filters.model.includes(car.model)) return false;
        if (filters.minYear && car.year < filters.minYear) return false;
        if (filters.maxYear && car.year > filters.maxYear) return false;
        if (filters.minPrice && car.price < filters.minPrice) return false;
        if (filters.maxPrice && car.price > filters.maxPrice) return false;
        if (filters.minMileage && car.mileage && car.mileage < filters.minMileage) return false;
        if (filters.maxMileage && car.mileage && car.mileage > filters.maxMileage) return false;
        // Add other filters as needed
        return true;
      });
    }

    if (loading && carsToRender.length === 0) {
      return <div className="text-center p-5"><div className="spinner-border text-danger" role="status"><span className="visually-hidden">Загрузка...</span></div></div>;
    }

    if (!loading && carsToRender.length === 0) {
      return <div className="alert alert-warning text-center">По вашему запросу автомобили не найдены. Попробуйте изменить параметры фильтрации.</div>;
    }

    return (
      <div className={`row row-cols-1 ${viewMode === 'grid' ? 'row-cols-md-2 row-cols-lg-3' : ''} g-4`}>
        {carsToRender.map((car) => (
          <div key={car.id} className="col">
            <div 
              className={`card h-100 shadow-sm car-card ${viewMode === 'list' ? 'd-flex flex-row' : ''}`}
              onClick={() => handleCarClick(car)}
              style={{ cursor: 'pointer', transition: 'box-shadow 0.3s ease-in-out' }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 0.5rem 1rem rgba(0, 0, 0, 0.15)')}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)')}
            >
              <div 
                className={`position-relative ${viewMode === 'list' ? 'car-list-image-wrapper' : ''}`}
                onMouseEnter={() => handleMouseEnterPhoto(car.id)}
                onMouseLeave={handleMouseLeavePhoto}
              >
                {viewMode === 'list' ? (
                  <div className="car-image-container">
                    {car.mainPhotoUrl ? (
                      <img 
                        src={car.mainPhotoUrl} 
                        alt={`${car.make} ${car.model}`}
                        className="car-image-list"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          // Обработка ошибки загрузки изображения
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Нет+фото';
                        }}
                      />
                    ) : (
                      <div className="no-image-placeholder">
                        <i className="bi bi-image text-muted"></i>
                        <span>Нет фото</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="car-image-container">
                    {car.mainPhotoUrl ? (
                        <img 
                            src={car.mainPhotoUrl} 
                            alt={`${car.make} ${car.model}`}
                            className="card-img-top car-image-grid" 
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                            onError={(e) => {
                                // Обработка ошибки загрузки изображения
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Нет+фото';
                            }}
                        />
                    ) : (
                        <div className="no-image-placeholder">
                            <i className="bi bi-image text-muted"></i>
                            <span>Нет фото</span>
                        </div>
                    )}
                  </div>
                )}
                {hoveredCarId === car.id && car.allPhotoUrls && car.allPhotoUrls.length > 1 && (
                  <>
                    <button 
                      className="photo-arrow prev-arrow position-absolute top-50 start-0 translate-middle-y ms-2 btn btn-sm btn-dark bg-opacity-50 rounded-circle"
                      onClick={(e) => handlePhotoArrowClick(e, 'prev', car)}
                      style={{ zIndex: 1 }}
                    >
                      <i className="bi bi-chevron-left"></i>
                    </button>
                    <button 
                      className="photo-arrow next-arrow position-absolute top-50 end-0 translate-middle-y me-2 btn btn-sm btn-dark bg-opacity-50 rounded-circle"
                      onClick={(e) => handlePhotoArrowClick(e, 'next', car)}
                      style={{ zIndex: 1 }}
                    >
                      <i className="bi bi-chevron-right"></i>
                    </button>
                    <div className="photo-counter position-absolute bottom-0 end-0 bg-dark bg-opacity-75 text-white px-2 py-1 rounded-pill mb-2 me-2" style={{ fontSize: '0.8rem' }}>
                      {hoveredPhotoIndex + 1} / {car.allPhotoUrls.length}
                    </div>
                  </>
                )}
              </div>
              <div className={`card-body d-flex flex-column ${viewMode === 'list' ? 'car-list-body' : ''}`}>
                <h5 className="card-title mb-1">{car.make} {car.model}</h5>
                <p className="card-text text-muted small mb-2">{car.year} г.</p>
                <h6 className="card-subtitle mb-2 fw-bold" style={{ color: 'var(--accent)' }}>{car.price.toLocaleString()} ₽</h6>
                <div className="mt-auto">
                  <p className="card-text small text-muted mb-1">
                    {car.engineInfo || car.technicalSpec?.fuelType}{car.technicalSpec?.engineVolume ? ` ${car.technicalSpec.engineVolume} л.` : ''}{car.technicalSpec?.horsePower ? ` / ${car.technicalSpec.horsePower} л.с.` : ''}
                  </p>
                  <p className="card-text small text-muted mb-1">
                    {car.transmissionInfo || car.technicalSpec?.transmissionType}, {car.technicalSpec?.driveType} привод
                  </p>
                  {car.mileage !== undefined && <p className="card-text small text-muted mb-2">Пробег: {car.mileage.toLocaleString()} км</p>}
                  {car.location && <p className="card-text small text-muted mb-0"><i className="bi bi-geo-alt-fill me-1"></i>{car.location}</p>}
                  
                  {/* Кнопка Заказать (НОВОЕ) */} 
                  {currentUser && (
                    <button 
                      className="btn btn-sm mt-3 w-100"
                      style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                      onClick={(e) => handleOrderClick(e, car)} // Используем новый обработчик
                    >
                      <i className="bi bi-cart-plus me-2"></i>Заказать
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container-fluid mt-4">
      {/* Filter Component */} 
      <Filter 
        filters={filters}
        selectedMake={filters.make && filters.make.length > 0 ? filters.make[0] : null} // Pass selected make
        makes={makes}
        models={models}
        bodyTypes={bodyTypes}
        colors={colors}
        fuelTypes={fuelTypes}
        transmissionTypes={transmissionTypes}
        driveTypes={driveTypes}
        onChange={(e) => {
          const { name, value, type, checked } = e.target as HTMLInputElement;
          handleFilterChange(name, type === 'checkbox' ? checked : value);
        }}
        onFilterChange={handleFilterChange}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        onMakeChange={(make) => {
          // Trigger model loading when make changes in Filter component
          setFilters(prev => ({ ...prev, make: make ? [make] : [], model: [], page: 0 }));
        }}
        modelsLoading={modelsLoading}
      />

      {/* Data Source Tabs */} 
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeDataSource === 'local' ? 'active' : ''}`}
            onClick={() => handleDataSourceChange('local')}
            style={activeDataSource === 'local' ? { color: 'var(--accent)', borderColor: 'var(--accent)', borderBottomColor: 'white' } : {}}
          >
            <i className="bi bi-database me-1"></i> Наша база
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeDataSource === 'external' ? 'active' : ''} ${parserErrorOccurred ? 'text-danger' : ''}`}
            onClick={() => handleDataSourceChange('external')}
            style={activeDataSource === 'external' ? { color: 'var(--accent)', borderColor: 'var(--accent)', borderBottomColor: 'white' } : {}}
          >
            <i className={`bi ${parserErrorOccurred ? 'bi-exclamation-triangle' : 'bi-cloud-download'} me-1`}></i> 
            Внешний источник {parserErrorOccurred ? '(Ошибка)' : ''}
          </button>
        </li>
      </ul>

      {/* View Mode and Sorting */} 
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <button 
            className={`btn btn-sm ${viewMode === 'list' ? 'btn-secondary' : 'btn-outline-secondary'} me-2`}
            onClick={() => handleViewModeChange('list')}
          >
            <i className="bi bi-list-ul"></i> Список
          </button>
          <button 
            className={`btn btn-sm ${viewMode === 'grid' ? 'btn-secondary' : 'btn-outline-secondary'}`}
            onClick={() => handleViewModeChange('grid')}
          >
            <i className="bi bi-grid-3x3-gap-fill"></i> Сетка
          </button>
        </div>
        <div className="position-relative" ref={sortDropdownRef}>
          <button 
            className="btn btn-sm btn-outline-secondary dropdown-toggle"
            onClick={() => setShowSortDropdown(!showSortDropdown)}
          >
            Сортировка: {
              filters.sortBy === 'createdAt' ? 'По дате добавления' : 
              filters.sortBy === 'price' ? 'По цене' : 
              filters.sortBy === 'year' ? 'По году выпуска' : 
              filters.sortBy === 'mileage' ? 'По пробегу' : 'По умолчанию'
            } ({filters.sortDirection === 'ASC' ? 'возр.' : 'убыв.'})
          </button>
          {showSortDropdown && (
            <ul className="dropdown-menu dropdown-menu-end show position-absolute" style={{ zIndex: 100 }}>
              <li><button className="dropdown-item" onClick={() => handleSortChange('createdAt', 'DESC')}>По дате добавления (сначала новые)</button></li>
              <li><button className="dropdown-item" onClick={() => handleSortChange('price', 'ASC')}>По цене (сначала дешевые)</button></li>
              <li><button className="dropdown-item" onClick={() => handleSortChange('price', 'DESC')}>По цене (сначала дорогие)</button></li>
              <li><button className="dropdown-item" onClick={() => handleSortChange('year', 'DESC')}>По году выпуска (сначала новые)</button></li>
              <li><button className="dropdown-item" onClick={() => handleSortChange('year', 'ASC')}>По году выпуска (сначала старые)</button></li>
              <li><button className="dropdown-item" onClick={() => handleSortChange('mileage', 'ASC')}>По пробегу (сначала меньше)</button></li>
              <li><button className="dropdown-item" onClick={() => handleSortChange('mileage', 'DESC')}>По пробегу (сначала больше)</button></li>
            </ul>
          )}
        </div>
      </div>

      {/* Error Message */} 
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Car List */} 
      {renderCars()}

      {/* Pagination */} 
      {activeDataSource === 'local' && pagination.totalPages > 1 && (
        <nav aria-label="Page navigation" className="mt-4 d-flex justify-content-center">
          <ul className="pagination">
            <li className={`page-item ${pagination.page === 0 ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => handlePageChange(pagination.page - 1)}>&laquo;</button>
            </li>
            {[...Array(pagination.totalPages).keys()].map(pageNumber => (
              <li key={pageNumber} className={`page-item ${pagination.page === pageNumber ? 'active' : ''}`}>
                <button className="page-link" onClick={() => handlePageChange(pageNumber)}>{pageNumber + 1}</button>
              </li>
            ))}
            <li className={`page-item ${pagination.page === pagination.totalPages - 1 ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => handlePageChange(pagination.page + 1)}>&raquo;</button>
            </li>
          </ul>
        </nav>
      )}

      {/* Modal for Car Details */} 
      {showModal && selectedCar && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{selectedCar.make} {selectedCar.model} - {selectedCar.year} г.</h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body p-0">
                <div className="row g-0">
                  <div className="col-lg-8 position-relative">
                    {selectedCar.allPhotoUrls && selectedCar.allPhotoUrls.length > 0 ? (
                      <>
                        <img 
                          src={selectedCar.allPhotoUrls[currentPhotoIndex]} 
                          className="img-fluid w-100" 
                          alt={`Фото ${currentPhotoIndex + 1}`}
                          style={{ maxHeight: '70vh', objectFit: 'contain', cursor: 'zoom-in' }}
                          onClick={() => handlePhotoClick(selectedCar, currentPhotoIndex)}
                        />
                        {selectedCar.allPhotoUrls.length > 1 && (
                          <>
                            <button 
                              className="btn btn-dark bg-opacity-50 position-absolute top-50 start-0 translate-middle-y ms-2 rounded-circle"
                              onClick={() => handlePhotoChange('prev')}
                              style={{ width: '40px', height: '40px' }}
                            >
                              <i className="bi bi-chevron-left"></i>
                            </button>
                            <button 
                              className="btn btn-dark bg-opacity-50 position-absolute top-50 end-0 translate-middle-y me-2 rounded-circle"
                              onClick={() => handlePhotoChange('next')}
                              style={{ width: '40px', height: '40px' }}
                            >
                              <i className="bi bi-chevron-right"></i>
                            </button>
                            <div className="position-absolute bottom-0 start-50 translate-middle-x mb-2 d-flex flex-wrap justify-content-center p-2" style={{ maxWidth: '90%' }}>
                              {selectedCar.allPhotoUrls.map((url, index) => (
                                <img 
                                  key={index}
                                  src={url}
                                  alt={`Миниатюра ${index + 1}`}
                                  className="img-thumbnail m-1"
                                  style={{
                                    width: '60px',
                                    height: '45px',
                                    objectFit: 'cover',
                                    cursor: 'pointer',
                                    border: currentPhotoIndex === index ? '2px solid var(--bs-primary)' : '1px solid #ddd',
                                    opacity: currentPhotoIndex === index ? 1 : 0.6
                                  }}
                                  onClick={() => handleThumbnailClick(index)}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </>
                    ) : selectedCar.mainPhotoUrl ? (
                      <img 
                        src={selectedCar.mainPhotoUrl} 
                        className="img-fluid w-100" 
                        alt={`${selectedCar.make} ${selectedCar.model}`}
                        style={{ maxHeight: '70vh', objectFit: 'contain' }}
                      />
                    ) : (
                      <img src="https://via.placeholder.com/800x600?text=Нет+фото" className="img-fluid w-100" alt="Нет фото" />
                    )}
                  </div>
                  <div className="col-lg-4 p-4">
                    <h4>{selectedCar.price.toLocaleString()} ₽</h4>
                    <hr />
                    <h6>Основные характеристики:</h6>
                    <ul className="list-unstyled small">
                      <li><strong>Год выпуска:</strong> {selectedCar.year}</li>
                      {selectedCar.mileage !== undefined && <li><strong>Пробег:</strong> {selectedCar.mileage.toLocaleString()} км</li>}
                      {selectedCar.bodyTypeName && <li><strong>Кузов:</strong> {selectedCar.bodyTypeName}</li>}
                      {selectedCar.colorName && <li><strong>Цвет:</strong> {selectedCar.colorName}</li>}
                      {selectedCar.technicalSpec && (
                        <>
                          <li><strong>Двигатель:</strong> {selectedCar.technicalSpec.fuelType}{selectedCar.technicalSpec.engineVolume ? `, ${selectedCar.technicalSpec.engineVolume} л` : ''}{selectedCar.technicalSpec.horsePower ? `, ${selectedCar.technicalSpec.horsePower} л.с.` : ''}</li>
                          <li><strong>Коробка:</strong> {selectedCar.technicalSpec.transmissionType}</li>
                          <li><strong>Привод:</strong> {selectedCar.technicalSpec.driveType}</li>
                        </>
                      )}
                      {selectedCar.condition && <li><strong>Состояние:</strong> {selectedCar.condition}</li>}
                      {selectedCar.location && <li><strong>Город:</strong> {selectedCar.location}</li>}
                    </ul>
                    {selectedCar.equipment && selectedCar.equipment.length > 0 && (
                      <>
                        <hr />
                        <h6>Комплектация:</h6>
                        <ul className="list-inline small">
                          {selectedCar.equipment.map((item, index) => (
                            <li key={index} className="list-inline-item bg-light border rounded px-2 py-1 m-1">{item}</li>
                          ))}
                        </ul>
                      </>
                    )}
                    {selectedCar.safetyFeatures && selectedCar.safetyFeatures.length > 0 && (
                      <>
                        <hr />
                        <h6>Безопасность:</h6>
                        <ul className="list-inline small">
                          {selectedCar.safetyFeatures.map((item, index) => (
                            <li key={index} className="list-inline-item bg-light border rounded px-2 py-1 m-1">{item}</li>
                          ))}
                        </ul>
                      </>
                    )}
                    {/* Кнопка Заказать в модальном окне (НОВОЕ) */} 
                    {currentUser && (
                      <button 
                        className="btn mt-3 w-100"
                        style={{ backgroundColor: 'var(--accent)', color: 'white' }}
                        onClick={(e) => handleOrderClick(e, selectedCar)} // Используем новый обработчик
                      >
                        <i className="bi bi-cart-plus me-2"></i>Заказать этот автомобиль
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Photo Viewer */} 
      {fullscreenMode && fullscreenCar && (
        <div 
          className="fullscreen-overlay position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)', zIndex: 1060 }}
          onClick={handleCloseFullscreen} // Close on overlay click
        >
          <div 
            className="fullscreen-content position-relative w-100 h-100 d-flex align-items-center justify-content-center"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside content
          >
            <img 
              src={fullscreenCar.allPhotoUrls ? fullscreenCar.allPhotoUrls[fullscreenPhotoIndex] : fullscreenCar.mainPhotoUrl}
              alt={`Фото ${fullscreenPhotoIndex + 1}`}
              className={`fullscreen-image ${isPhotoChanging ? 'fade-out' : 'fade-in'}`}
              style={{
                maxWidth: '90%',
                maxHeight: '90%',
                objectFit: 'contain',
                transition: 'opacity 0.15s ease-in-out'
              }}
            />
            
            {/* Навигация по фото */}
            {fullscreenCar.allPhotoUrls && fullscreenCar.allPhotoUrls.length > 1 && (
              <>
                <button 
                  className="arrow-button prev-arrow position-absolute top-50 start-0 translate-middle-y ms-4"
                  style={{
                    background: 'rgba(0, 0, 0, 0.5)',
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
                  onClick={(e) => {
                    e.stopPropagation();
                    const newIndex = fullscreenPhotoIndex === 0 
                      ? fullscreenCar.allPhotoUrls!.length - 1 
                      : fullscreenPhotoIndex - 1;
                    handleChangeFullscreenPhoto(newIndex);
                  }}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
                <button 
                  className="arrow-button next-arrow position-absolute top-50 end-0 translate-middle-y me-4"
                  style={{
                    background: 'rgba(0, 0, 0, 0.5)',
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
                  onClick={(e) => {
                    e.stopPropagation();
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
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent closing fullscreen
                        handleChangeFullscreenPhoto(index);
                      }}
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
      )}
      
      {/* Модальное окно заказа (НОВОЕ) */} 
      <OrderModal 
        isOpen={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        car={orderCar}
      />
      
      {showScrollButton && <button onClick={scrollToTop} className="btn btn-primary position-fixed bottom-0 end-0 m-3" style={{zIndex: 1050}}><i className="bi bi-arrow-up"></i></button>}
    </div>
  );
};

export default MainContainer;
