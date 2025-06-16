import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import Filter from './Filter';
import OrderModal from './OrderModal';

import CustomRequestForm from './CustomRequestForm'; // Import the new form
import { useAuth } from '../firebase/AuthContext';

// Interfaces (Car, BodyType, Color, ApiResponse, CarFilter remain the same)
interface Car {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  engineVolume: number;
  horsePower: number;
  transmissionType: string;
  driveType: string;
  fuelType: string;
  color: string;
  bodyType: string;
  location: string;
  photos: string[];
  isInActiveOrder?: boolean;
  condition?: string;
  createdAt?: string;
  mainPhotoUrl?: string;
  equipment?: string[];
  safetyFeatures?: string[];
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

export interface CarFilter { 
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
  sortDirection?: 'asc' | 'desc';
  searchQuery?: string;
}

// Interface for Order (needed for checking active orders)
interface Order {
  id: string;
  userId: string;
  carId: number | string;
  status: 'new' | 'processing' | 'in_transit' | 'completed' | 'cancelled';
  // Other fields might exist but are not needed for this check
}

// Тип для марок и моделей
type MakeModel = string | { id?: number; name?: string; [key: string]: any };

interface FilterProps {
  filters: CarFilter;
  selectedMake: string;
  makes: MakeModel[];
  models: MakeModel[];
  bodyTypes: BodyType[];
  colors: Color[];
  fuelTypes: string[];
  transmissionTypes: string[];
  driveTypes: string[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void;
  onFilterChange: (field: keyof CarFilter, value: any) => void;
  onApply: () => void;
  onReset: () => void;
  onResetFilters: () => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onSortChange: (order: 'asc' | 'desc') => void;
  sortOrder: 'asc' | 'desc';
  onSearch: (query: string) => void;
  searchQuery: string;
  parserErrorOccurred: boolean;
}

const MainContainer: React.FC = () => {
  const API_URL = 'http://localhost:8080/api';
  const ORDER_API_URL = 'http://localhost:3001'; // URL for the Node.js order backend
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
  
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number>(0);
  
  const [fullscreenMode, setFullscreenMode] = useState<boolean>(false);
  const [fullscreenCar, setFullscreenCar] = useState<Car | null>(null);
  const [fullscreenPhotoIndex, setFullscreenPhotoIndex] = useState<number>(0);
  const [isPhotoChanging, setIsPhotoChanging] = useState<boolean>(false);
  
  const [hoveredCarId, setHoveredCarId] = useState<number | string | null>(null);
  const [hoveredPhotoIndex, setHoveredPhotoIndex] = useState<number>(0);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [showScrollButton, setShowScrollButton] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list'); // Default view mode
  const [showSortDropdown, setShowSortDropdown] = useState<boolean>(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const [activeDataSource, setActiveDataSource] = useState<'local' | 'external'>('local');
  const [parserErrorOccurred, setParserErrorOccurred] = useState<boolean>(false);
  const [filters, setFilters] = useState<CarFilter>({
    page: 0,
    size: 10,
    sortDirection: 'desc',
    sortBy: 'createdAt',
    make: [],
    model: [],
    bodyTypeId: [],
    fuelType: [],
    transmissionType: [],
    driveType: [],
    colorId: [],
  });

  const [showOrderModal, setShowOrderModal] = useState<boolean>(false);
  const [orderCar, setOrderCar] = useState<Car | null>(null);
  const [showCustomRequestForm, setShowCustomRequestForm] = useState<boolean>(false); // State for custom request form visibility

  const { currentUser, isAdmin } = useAuth();

  // State to store all active orders (NEW)
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);

  // Функция для фильтрации машин в зависимости от роли пользователя
  const filterCarsByUserRole = useCallback((cars: Car[]): Car[] => {
    if (isAdmin) {
      return cars; // Админ видит все машины
    }
    // Для обычных пользователей и неавторизованных показываем только доступные машины, если заказы есть
    if (activeOrders.length > 0) {
      return cars.filter(car => !isCarInActiveOrder(car.id));
    }
    // Если заказы ещё не загружены, показываем все машины
    return cars;
  }, [isAdmin, activeOrders]);

  // Fetch all orders to check for active ones (NEW)
  const fetchAllOrders = useCallback(async () => {
    try {
      const response = await axios.get<Order[]>(`${ORDER_API_URL}/orders`);
      // Filter for active orders (new, processing, in_transit)
      const active = response.data.filter(order => 
        order.status === 'new' || order.status === 'processing' || order.status === 'in_transit'
      );
      setActiveOrders(active);
    } catch (error) {
      console.error('Ошибка при загрузке всех заказов:', error);
      // Handle error appropriately, maybe show a message to the user
    }
  }, [ORDER_API_URL]);

  // Fetch orders when the component mounts or when an order might have been placed/updated
  useEffect(() => {
    fetchAllOrders();
  }, [fetchAllOrders, showOrderModal]); // Re-fetch when order modal closes

  const handleOrderClick = (e: React.MouseEvent, car: Car) => {
    e.stopPropagation();
    setOrderCar(car);
    setShowOrderModal(true);
  };

  // Functions for fetching dictionaries (fetchBodyTypes, fetchColors, etc.) remain the same
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

  useEffect(() => {
    const fetchDictionaries = async () => {
      // setLoading(true); // Consider if separate loading state is needed
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
        // setLoading(false);
      }
    };
    fetchDictionaries();
  }, [fetchBodyTypes, fetchColors, fetchMakes, fetchFuelTypes, fetchTransmissionTypes, fetchDriveTypes]);

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

  // --- Вынесенная функция загрузки машин ---
  const fetchCars = useCallback(async (customFilters?: CarFilter) => {
    setLoading(true);
    try {
      // Формируем параметры запроса корректно для массивов
      const filtersToUse = customFilters || filters;
      const params = new URLSearchParams();
      Object.entries(filtersToUse).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") return;
        if (Array.isArray(value)) {
          value.forEach((item) => {
            if (item !== undefined && item !== null && item !== "") {
              params.append(key, item);
            }
          });
        } else {
          params.append(key, value as any);
        }
      });
      // Явно добавляем параметры пагинации и сортировки (если нужны)
      if (!params.has("page")) params.append("page", String(filtersToUse.page ?? 0));
      if (!params.has("size")) params.append("size", String(filtersToUse.size ?? 10));
      if (!params.has("sortBy") && filtersToUse.sortBy) params.append("sortBy", filtersToUse.sortBy);
      if (!params.has("sortDirection") && filtersToUse.sortDirection) params.append("sortDirection", filtersToUse.sortDirection);

      const response = await axios.get<ApiResponse<Car[]>>(`${API_URL}/cars`, { params });
      // Проверяем оба поля: content и data
      const carsArr = response.data?.content || response.data?.data || [];
      const filteredCars = filterCarsByUserRole(carsArr);
      setCars(filteredCars);
      setPagination({
        page: response.data.number || 0,
        totalPages: response.data.totalPages || 0,
        totalElements: response.data.totalElements || 0
      });
    } catch (error) {
      console.error('Ошибка при загрузке машин:', error);
      setError('Произошла ошибка при загрузке машин');
    } finally {
      setLoading(false);
    }
  }, [API_URL, filters, filterCarsByUserRole]);

  // --- Функция загрузки внешних машин (перемещена выше useEffect) ---
  const fetchExternalCars = useCallback(async () => {
    setLoading(true);
    setError(null);
    setParserErrorOccurred(false);
    try {
      // Attempt to fetch from the local path first
      const response = await axios.get<Car[]>('/kolesa_parsed_cars.json');
      setAllExternalCars(response.data || []);
    } catch (err) {
      console.warn('Не удалось загрузить kolesa_parsed_cars.json локально, попытка загрузить из /dist');
      try {
        // Fallback to fetching from /dist if the root path fails (common in build scenarios)
        const fallbackResponse = await axios.get<Car[]>('/dist/kolesa_parsed_cars.json');
        setAllExternalCars(fallbackResponse.data || []);
      } catch (fallbackErr) {
        console.error('Ошибка при загрузке внешних автомобилей (локально и из /dist):', fallbackErr);
        setError('Не удалось загрузить данные с внешнего источника (kolesa.kz)');
        setAllExternalCars([]);
        setParserErrorOccurred(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // --- useEffect для загрузки машин ---
  useEffect(() => {
    if (activeDataSource === 'local') {
      fetchCars();
    } else {
      fetchExternalCars();
    }
  }, [fetchCars, fetchExternalCars, filters, activeDataSource]);

  // --- Исправленные обработчики ---
  const handleFilterChange: (field: keyof CarFilter, value: any) => void = (field, value) => {
    setFilters(prev => {
      const newFilter = { ...prev, [field]: value, page: 0 };
      if (field === 'make') {
        newFilter.model = [];
      }
      return newFilter;
    });
  };

  const handleApplyFilters = () => {
    if (activeDataSource === 'local') {
      fetchCars();
    }
  };

  const handleResetFilters = () => {
    const defaultFilters: CarFilter = {
      page: 0,
      size: 10,
      sortDirection: 'desc',
      sortBy: 'createdAt',
      make: [], model: [], bodyTypeId: [], fuelType: [], transmissionType: [], driveType: [], colorId: [],
    };
    setFilters(defaultFilters);
    if (activeDataSource === 'local') {
      fetchCars(defaultFilters);
    }
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleSortChange = (order: 'asc' | 'desc') => {
    setFilters(prev => ({
      ...prev,
      sortDirection: order
    }));
  };

  const handleSearch = (query: string) => {
    setFilters(prev => ({
      ...prev,
      searchQuery: query
    }));
  };

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
  };

  const handleDataSourceChange = (source: 'local' | 'external') => {
    setActiveDataSource(source);
    // Reset filters when changing source? Optional, depends on desired UX
    // handleResetFilters(); 
  };

  // --- Remaining event handlers and render logic ---
  // (handleCarClick, openFullscreen, closeFullscreen, handlePhotoChange, 
  // handleMouseEnter, handleMouseLeave, handleMouseMove, handleScroll, scrollToTop)
  // These remain largely unchanged.

  const handleCarClick = (car: Car) => {
    setSelectedCar(car);
    setCurrentPhotoIndex(0);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCar(null);
  };

  const openFullscreen = (car: Car, index: number) => {
    setFullscreenCar(car);
    setFullscreenPhotoIndex(index);
    setFullscreenMode(true);
  };

  const closeFullscreen = () => {
    setFullscreenMode(false);
    setFullscreenCar(null);
  };

  const handlePhotoChange = (direction: 'prev' | 'next') => {
    if (!selectedCar || !selectedCar.photos || selectedCar.photos.length === 0) return;
    
    setIsPhotoChanging(true);
    setTimeout(() => {
      setCurrentPhotoIndex(prevIndex => {
        const newIndex = direction === 'next'
          ? (prevIndex + 1) % (selectedCar.photos?.length || 1)
          : (prevIndex - 1 + (selectedCar.photos?.length || 1)) % (selectedCar.photos?.length || 1);
        return newIndex;
      });
      setIsPhotoChanging(false);
    }, 150); // Duration should match CSS transition
  };

  const handleFullscreenPhotoChange = (direction: 'prev' | 'next') => {
    if (!fullscreenCar || !fullscreenCar.photos || fullscreenCar.photos.length === 0) return;
    
    setIsPhotoChanging(true);
    setTimeout(() => {
      setFullscreenPhotoIndex(prevIndex => {
        const newIndex = direction === 'next'
          ? (prevIndex + 1) % (fullscreenCar.photos?.length || 1)
          : (prevIndex - 1 + (fullscreenCar.photos?.length || 1)) % (fullscreenCar.photos?.length || 1);
        return newIndex;
      });
      setIsPhotoChanging(false);
    }, 150);
  };

  const handleMouseEnter = (carId: number | string) => {
    setHoveredCarId(carId);
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    // Optional: Reset index immediately or after a delay
    // setTimeout(() => setHoveredPhotoIndex(0), 100); 
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, photoCount: number) => {
    if (!isHovering || photoCount <= 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left; // x position within the element.
    const width = rect.width;
    const segmentWidth = width / photoCount;
    const newIndex = Math.min(Math.floor(x / segmentWidth), photoCount - 1);
    
    if (newIndex !== hoveredPhotoIndex) {
      setHoveredPhotoIndex(newIndex);
    }
  };

  const handleScroll = useCallback(() => {
    if (window.scrollY > 300) {
      setShowScrollButton(true);
    } else {
      setShowScrollButton(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Click outside handler for sort dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter external cars based on current filters
  const filteredExternalCars = allExternalCars.filter(car => {
    if (filters.make && filters.make.length > 0 && !filters.make.includes(car.make)) return false;
    if (filters.model && filters.model.length > 0 && !filters.model.includes(car.model)) return false;
    if (filters.minYear && car.year < filters.minYear) return false;
    if (filters.maxYear && car.year > filters.maxYear) return false;
    if (filters.minPrice && car.price < filters.minPrice) return false;
    if (filters.maxPrice && car.price > filters.maxPrice) return false;
    if (filters.fuelType && filters.fuelType.length > 0 && car.fuelType && !filters.fuelType.includes(car.fuelType)) return false;
    // Add more filters as needed (body type, color etc. might need mapping from names/hex to IDs if using those filters)
    return true;
  });

  // Apply sorting to external cars
  const sortedExternalCars = [...filteredExternalCars].sort((a, b) => {
    const field = filters.sortBy || 'createdAt'; // Default sort field
    const direction = filters.sortDirection === 'asc' ? 1 : -1;

    let valA: any = (a as any)[field];
    let valB: any = (b as any)[field];

    // Handle specific fields like price or year if they need numeric comparison
    if (field === 'price' || field === 'year' || field === 'mileage') {
      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
    } else if (field === 'createdAt' || field === 'updatedAt') {
      // Assuming createdAt/updatedAt might not exist or be strings for external cars
      valA = valA ? new Date(valA).getTime() : 0;
      valB = valB ? new Date(valB).getTime() : 0;
    } else {
      // Default to string comparison
      valA = String(valA || '').toLowerCase();
      valB = String(valB || '').toLowerCase();
    }

    if (valA < valB) return -1 * direction;
    if (valA > valB) return 1 * direction;
    return 0;
  });

  // Apply pagination to external cars
  const paginatedExternalCars = sortedExternalCars.slice(
    (filters.page || 0) * (filters.size || 10),
    ((filters.page || 0) + 1) * (filters.size || 10)
  );

  const displayCars = activeDataSource === 'local' ? cars : paginatedExternalCars;
  const displayTotalPages = activeDataSource === 'local' 
    ? pagination.totalPages 
    : Math.ceil(sortedExternalCars.length / (filters.size || 10));
  const displayTotalElements = activeDataSource === 'local' 
    ? pagination.totalElements 
    : sortedExternalCars.length;

  // Check if a car is currently in an active order (NEW)
  const isCarInActiveOrder = (carId: number | string): boolean => {
    return activeOrders.some(order => order.carId === carId);
  };

  return (
    <div className="container-fluid mt-3">
      {/* Filter Section - Now takes full width */}
      <div className="row mb-4">
        <div className="col-12">
          <Filter
            filters={filters}
            selectedMake={selectedCar?.make || ''}
            makes={makes}
            models={models}
            bodyTypes={bodyTypes}
            colors={colors}
            fuelTypes={fuelTypes}
            transmissionTypes={transmissionTypes}
            driveTypes={driveTypes}
            onChange={handleFilterChange as any}
            onFilterChange={handleFilterChange}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
            onResetFilters={handleResetFilters}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onSortChange={handleSortChange}
            sortOrder={filters.sortDirection || 'asc'}
            onSearch={handleSearch}
            searchQuery={filters.searchQuery || ''}
            parserErrorOccurred={parserErrorOccurred}
          />
          {/* Add Custom Request Button/Section - Moved under Filter */}
          {currentUser && !isAdmin && (
            <div className="mt-3">
              <button 
                className="btn btn-outline-success" 
                onClick={() => setShowCustomRequestForm(prev => !prev)} // Toggle form visibility
              >
                {showCustomRequestForm ? <><i className="bi bi-x-lg me-1"></i> Скрыть форму заявки</> : <><i className="bi bi-pencil-square me-1"></i> Оставить заявку на подбор</>}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Conditionally render Custom Request Form - Moved above car list */}
      {showCustomRequestForm && currentUser && !isAdmin && (
        <div className="row mb-4">
          <div className="col-12">
            <CustomRequestForm onClose={() => setShowCustomRequestForm(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area - Car List/Grid */}
      <div className="row">
        <div className="col-12">
          {/* View Mode and Sorting Controls */}
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            {/* <span className="text-muted small">Найдено: {displayTotalElements} автомобилей</span> */}
            <span className='m-3 h4 px-2'> Автомобили AutoBro</span>
            <div className="d-flex align-items-center gap-2">
              {/* Sorting Dropdown */}
              <div className="position-relative" ref={sortDropdownRef}>
                <button 
                  className="btn btn-sm btn-outline-secondary dropdown-toggle" 
                  type="button"
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                >
                  <i className="bi bi-sort-down me-1"></i>
                  Сортировка
                </button>
                {showSortDropdown && (
                  <div className="dropdown-menu dropdown-menu-end show position-absolute" style={{ zIndex: 1050 }}>
                    <h6 className="dropdown-header">По полю</h6>
                    <button className={`dropdown-item ${filters.sortBy === 'createdAt' ? 'active' : ''}`} onClick={() => handleSortChange('asc')}>Дата добавления</button>
                    <button className={`dropdown-item ${filters.sortBy === 'price' ? 'active' : ''}`} onClick={() => handleSortChange('desc')}>Цена</button>
                    <button className={`dropdown-item ${filters.sortBy === 'year' ? 'active' : ''}`} onClick={() => handleSortChange('asc')}>Год выпуска</button>
                    <button className={`dropdown-item ${filters.sortBy === 'mileage' ? 'active' : ''}`} onClick={() => handleSortChange('desc')}>Пробег</button>
                    <div className="dropdown-divider"></div>
                    <h6 className="dropdown-header">По направлению</h6>
                    <button className={`dropdown-item ${filters.sortDirection === 'desc' ? 'active' : ''}`} onClick={() => handleSortChange('desc')}>По убыванию</button>
                    <button className={`dropdown-item ${filters.sortDirection === 'asc' ? 'active' : ''}`} onClick={() => handleSortChange('asc')}>По возрастанию</button>
                  </div>
                )}
              </div>
              {/* View Mode Buttons */}
              <div className="btn-group btn-group-sm">
                <button 
                  type="button" 
                  className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => handleViewModeChange('list')}
                  title="Списком"
                >
                  <i className="bi bi-list-ul"></i>
                </button>
                <button 
                  type="button" 
                  className={`btn ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => handleViewModeChange('grid')}
                  title="Сеткой"
                >
                  <i className="bi bi-grid-3x3-gap-fill"></i>
                </button>
              </div>
            </div>
          </div>

          {/* Loading and Error States */}
          {loading && (
            <div className="text-center p-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Загрузка...</span>
              </div>
            </div>
          )}
          {error && <div className="alert alert-danger">{error}</div>}

          {/* Car List/Grid */}
          {!loading && !error && (
            // Adjusted grid classes for potentially different original look
            <div className={`row row-cols-1 ${viewMode === 'grid' ? 'row-cols-md-2 row-cols-xl-3' : ''} g-4`}>
              {displayCars.length > 0 ? (
                displayCars.map(car => (
                  <div key={car.id} className="col">
                    <div 
                      className="card h-100 car-card shadow-sm" 
                      onClick={() => handleCarClick(car)}
                      onMouseEnter={() => handleMouseEnter(car.id)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <div 
                        className="position-relative car-image-container"
                        onMouseMove={(e) => handleMouseMove(e, car.photos?.length || 1)}
                      >
                        <img 
                          src={car.photos && car.photos.length > 0
                            ? (hoveredCarId === car.id && typeof hoveredPhotoIndex === 'number' && car.photos[hoveredPhotoIndex]
                                ? car.photos[hoveredPhotoIndex]
                                : car.photos[0])
                            : (car.mainPhotoUrl || 'https://via.placeholder.com/300x200?text=Нет+фото')}
                          className="card-img-top car-image w-100" 
                          alt={`${car.make} ${car.model}`}
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Нет+фото'; }}
                        />
                        {/* Photo indicator dots */}
                        {hoveredCarId === car.id && car.photos && car.photos.length > 1 && (
                          <div className="photo-dots-indicator">
                            {car.photos.map((_, index) => (
                              <span key={index} className={`dot ${index === hoveredPhotoIndex ? 'active' : ''}`}></span>
                            ))}
                          </div>
                        )}
                        {/* Order Button - Disable if car is in active order */} 
                        {currentUser && (
                          <button 
                            className={`btn btn-sm order-button w-100 mt-1 ${isCarInActiveOrder(car.id) ? 'btn-secondary disabled' : 'btn-success'}`}
                            onClick={(e) => handleOrderClick(e, car)}
                            disabled={isCarInActiveOrder(car.id)}
                            title={isCarInActiveOrder(car.id) ? "Автомобиль уже заказан" : "Оформить заказ на этот автомобиль"}
                          >
                            {isCarInActiveOrder(car.id) ? <><i className="bi bi-bag-check-fill me-1"></i> Заказан</> : <><i className="bi bi-cart-plus me-1"></i> Заказать</>}
                          </button>
                        )}
                      </div>
                      <div className="card-body d-flex flex-column">
                        <h5 className="card-title fs-6 mb-1">{car.make} {car.model}</h5>
                        <p className="card-text text-primary fw-bold mb-2 fs-5">{car.price.toLocaleString()} ₽</p>
                        <div className="car-details small text-muted mb-3 flex-grow-1">
                          <span>{car.year}г. </span>
                          {car.mileage !== undefined && <span>{car.mileage.toLocaleString()}км </span>}
                          {car.engineVolume && <span>{car.engineVolume.toLocaleString()}л </span>}
                          {car.horsePower && <span>{car.horsePower.toLocaleString()}л.с. </span>}
                          {car.bodyType && <span>{car.bodyType} </span>}
                          {car.color && <span>{car.color} </span>}
                          {car.location && <span>{car.location} </span>}
                        </div>
                        <div className="mt-auto d-flex justify-content-between align-items-center">
                          <span className="text-muted x-small">ID: {car.id ? String(car.id).substring(0, 6) : '------'}</span>
                          <span className="text-muted x-small">Добавлено: {car.createdAt ? new Date(car.createdAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-12">
                  <div className="alert alert-secondary text-center">По вашему запросу автомобили не найдены. Попробуйте изменить параметры фильтра.</div>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {!loading && displayTotalPages > 1 && (
            <nav aria-label="Page navigation" className="mt-4 d-flex justify-content-center">
              <ul className="pagination pagination-sm">
                <li className={`page-item ${filters.page === 0 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => handlePageChange(filters.page! - 1)} aria-label="Previous">
                    <span aria-hidden="true">&laquo;</span>
                  </button>
                </li>
                {[...Array(displayTotalPages)].map((_, i) => (
                  <li key={i} className={`page-item ${filters.page === i ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => handlePageChange(i)}>{i + 1}</button>
                  </li>
                ))}
                <li className={`page-item ${filters.page === displayTotalPages - 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => handlePageChange(filters.page! + 1)} aria-label="Next">
                    <span aria-hidden="true">&raquo;</span>
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>
      </div>

      {/* Car Detail Modal */}
      {showModal && selectedCar && (
        <div className="modal fade show car-details-modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.7)' }} tabIndex={-1} onClick={closeModal}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{selectedCar.make} {selectedCar.model} - {selectedCar.year}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                <div className="car-gallery mb-4">
                  <img 
                    src={selectedCar.photos && selectedCar.photos.length > 0
                      ? selectedCar.photos[currentPhotoIndex]
                      : (selectedCar.mainPhotoUrl || 'https://via.placeholder.com/800x500?text=Нет+фото')}
                    className={`main-image ${isPhotoChanging ? 'fade-out' : 'fade-in'}`}
                    alt={`${selectedCar.make} ${selectedCar.model} - Фото ${currentPhotoIndex + 1}`}
                    onClick={() => openFullscreen(selectedCar, currentPhotoIndex)}
                  />
                  {selectedCar.photos && selectedCar.photos.length > 1 && (
                    <div className="thumbnail-container">
                      {selectedCar.photos.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`${selectedCar.make} ${selectedCar.model} - Фото ${index + 1}`}
                          className={`thumbnail ${index === currentPhotoIndex ? 'active' : ''}`}
                          onClick={() => setCurrentPhotoIndex(index)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="row">
                  <div className="col-md-8">
                    <div className="car-info-section">
                      <h4 className="section-title">Основные характеристики</h4>
                      <div className="specs-grid">
                        {selectedCar.year && (
                          <div className="spec-item">
                            <div className="spec-icon"><i className="bi bi-calendar"></i></div>
                            <div className="spec-info"><div className="spec-label">Год</div><div className="spec-value">{selectedCar.year}</div></div>
                          </div>
                        )}
                        {selectedCar.mileage !== undefined && (
                          <div className="spec-item">
                            <div className="spec-icon"><i className="bi bi-speedometer2"></i></div>
                            <div className="spec-info"><div className="spec-label">Пробег</div><div className="spec-value">{selectedCar.mileage.toLocaleString()} км</div></div>
                          </div>
                        )}
                        {selectedCar.engineVolume && (
                          <div className="spec-item">
                            <div className="spec-icon"><i className="bi bi-gear"></i></div>
                            <div className="spec-info"><div className="spec-label">Объем двигателя</div><div className="spec-value">{selectedCar.engineVolume.toLocaleString()} л</div></div>
                          </div>
                        )}
                        {selectedCar.horsePower && (
                          <div className="spec-item">
                            <div className="spec-icon"><i className="bi bi-lightning"></i></div>
                            <div className="spec-info"><div className="spec-label">Мощность</div><div className="spec-value">{selectedCar.horsePower.toLocaleString()} л.с.</div></div>
                          </div>
                        )}
                        {selectedCar.bodyType && (
                          <div className="spec-item">
                            <div className="spec-icon"><i className="bi bi-car-front-fill"></i></div>
                            <div className="spec-info"><div className="spec-label">Кузов</div><div className="spec-value">{selectedCar.bodyType}</div></div>
                          </div>
                        )}
                        {selectedCar.color && (
                          <div className="spec-item">
                            <div className="spec-icon"><i className="bi bi-palette"></i></div>
                            <div className="spec-info"><div className="spec-label">Цвет</div><div className="spec-value">{selectedCar.color}</div></div>
                          </div>
                        )}
                        {selectedCar.location && (
                          <div className="spec-item">
                            <div className="spec-icon"><i className="bi bi-geo-alt"></i></div>
                            <div className="spec-info"><div className="spec-label">Город</div><div className="spec-value">{selectedCar.location}</div></div>
                          </div>
                        )}
                        {selectedCar.fuelType && (
                          <div className="spec-item">
                            <div className="spec-icon"><i className="bi bi-fuel-pump"></i></div>
                            <div className="spec-info"><div className="spec-label">Топливо</div><div className="spec-value">{selectedCar.fuelType}</div></div>
                          </div>
                        )}
                        {selectedCar.transmissionType && (
                          <div className="spec-item">
                            <div className="spec-icon"><i className="bi bi-gear-wide-connected"></i></div>
                            <div className="spec-info"><div className="spec-label">КПП</div><div className="spec-value">{selectedCar.transmissionType}</div></div>
                          </div>
                        )}
                        {selectedCar.driveType && (
                          <div className="spec-item">
                            <div className="spec-icon"><i className="bi bi-cursor"></i></div>
                            <div className="spec-info"><div className="spec-label">Привод</div><div className="spec-value">{selectedCar.driveType}</div></div>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedCar.condition && (
                      <div className="car-info-section">
                        <h4 className="section-title">Состояние</h4>
                        <p className="description">{selectedCar.condition}</p>
                      </div>
                    )}

                    {((selectedCar.equipment && selectedCar.equipment.length > 0) || (selectedCar.safetyFeatures && selectedCar.safetyFeatures.length > 0)) && (
                      <div className="car-info-section">
                        <h4 className="section-title">Дополнительные опции</h4>
                        <ul className="list-unstyled mb-0">
                          {selectedCar.equipment?.map((item, idx) => (
                            <li key={'eq-' + idx}><i className="bi bi-check2-circle text-success me-2"></i>{item}</li>
                          ))}
                          {selectedCar.safetyFeatures?.map((item, idx) => (
                            <li key={'sf-' + idx}><i className="bi bi-shield-check text-primary me-2"></i>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="col-md-4">
                    <div className="price-section">
                      <div className="price-value">{selectedCar.price.toLocaleString()} ₽</div>
                      <div className="action-buttons">
                        <button 
                          className="btn-order"
                          onClick={() => {
                            setOrderCar(selectedCar);
                            setShowOrderModal(true);
                            closeModal();
                          }}
                          disabled={selectedCar.isInActiveOrder}
                        >
                          {selectedCar.isInActiveOrder ? 'Автомобиль в заказе' : 'Заказать'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Viewer */}
      {fullscreenMode && fullscreenCar && (
        <div className="fullscreen-modal" onClick={closeFullscreen}>
          <button className="btn-close btn-close-white fullscreen-close-btn" onClick={closeFullscreen}></button>
          <img 
            src={fullscreenCar.photos && fullscreenCar.photos.length > 0 
                 ? fullscreenCar.photos[fullscreenPhotoIndex] 
                 : 'https://via.placeholder.com/1200x800?text=Нет+фото'}
            className={`fullscreen-image ${isPhotoChanging ? 'fade-out' : 'fade-in'}`}
            alt={`${fullscreenCar.make} ${fullscreenCar.model} - Фото ${fullscreenPhotoIndex + 1}`}
            onClick={e => e.stopPropagation()} // Prevent closing when clicking image
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/1200x800?text=Нет+фото'; }}
          />
          {fullscreenCar.photos && fullscreenCar.photos.length > 1 && (
            <>
              <button className="carousel-control-prev fullscreen-nav" type="button" onClick={(e) => { e.stopPropagation(); handleFullscreenPhotoChange('prev'); }}>
                <span className="carousel-control-prev-icon" aria-hidden="true"></span>
              </button>
              <button className="carousel-control-next fullscreen-nav" type="button" onClick={(e) => { e.stopPropagation(); handleFullscreenPhotoChange('next'); }}>
                <span className="carousel-control-next-icon" aria-hidden="true"></span>
              </button>
              <div className="photo-counter-fullscreen">
                {fullscreenPhotoIndex + 1} / {fullscreenCar.photos.length}
              </div>
            </>
          )}
        </div>
      )}

      {/* Order Modal */}
      <OrderModal 
        isOpen={showOrderModal} 
        onClose={() => setShowOrderModal(false)} 
        car={orderCar} 
      />

      {/* Scroll to top button */}
      {showScrollButton && (
        <button onClick={scrollToTop} className="btn btn-primary rounded-circle position-fixed bottom-0 end-0 m-3 shadow" style={{ zIndex: 1030 }} title="Наверх">
          <i className="bi bi-arrow-up"></i>
        </button>
      )}
    </div>
  );
};

export default MainContainer;

