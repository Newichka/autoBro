import React, { useState, useEffect } from 'react';

// Определяем интерфейсы для данных автомобиля, основываясь на CarDTO
interface TechnicalSpec {
  fuelType: string;
  engineVolume?: number;
  horsePower?: number;
  driveType: string;
  transmissionType: string;
  engineInfo?: string;
  transmissionInfo?: string;
  gears?: number;
}

interface Car {
  id: number; // Добавляем ID, так как он используется в key
  make: string;
  model: string;
  year: number;
  bodyTypeName: string;
  price: number;
  mileage?: number;
  engineInfo?: string; // Поле из CarDTO
  transmissionInfo?: string; // Поле из CarDTO
  colorName: string;
  colorHexCode: string;
  condition: string;
  location: string;
  mainPhotoUrl?: string;
  photos?: string[];
  safetyFeatures?: string[];
  equipment?: string[];
  technicalSpec: TechnicalSpec;
}

// Интерфейс для пропсов компонента
interface CanDeliverTabProps {
  filters: any; // Используем тип из MainContainer
  viewMode: 'grid' | 'list';
  onShowDetails: (car: Car) => void; // Обновляем тип на Car
}

const CanDeliverTab: React.FC<CanDeliverTabProps> = ({ filters, viewMode, onShowDetails }) => {
  // Состояние для хранения автомобилей с бэкенда
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Состояние для отслеживания наведения на изображение
  const [hoveredCarId, setHoveredCarId] = useState<number | null>(null);
  const [hoveredPhotoIndex, setHoveredPhotoIndex] = useState<number>(0);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  
  // Состояние для полноэкранного просмотра
  const [fullscreenMode, setFullscreenMode] = useState<boolean>(false);
  const [fullscreenCar, setFullscreenCar] = useState<Car | null>(null);
  const [fullscreenPhotoIndex, setFullscreenPhotoIndex] = useState<number>(0);
  const [isPhotoChanging, setIsPhotoChanging] = useState<boolean>(false);

  // Загрузка автомобилей с бэкенда при изменении фильтров
  useEffect(() => {
    const fetchCars = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Формируем параметры запроса из фильтров
        const queryParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            // Преобразуем ключи фильтров фронтенда в ожидаемые бэкендом (если нужно)
            // Например, bodyTypeId -> bodyTypeNames, colorId -> colorNames
            let backendKey = key;
            if (key === 'bodyTypeId') backendKey = 'bodyTypeNames';
            if (key === 'colorId') backendKey = 'colorNames';
            if (key === 'size') backendKey = 'size'; // Убедимся, что параметры пагинации передаются
            if (key === 'page') backendKey = 'page';

            if (Array.isArray(value)) {
              value.forEach(item => queryParams.append(backendKey, item.toString()));
            } else {
              queryParams.append(backendKey, value.toString());
            }
          }
        });
        
        // Устанавливаем размер страницы по умолчанию, если не задан
        if (!queryParams.has('size')) {
          queryParams.append('size', '12'); // Или другое значение по умолчанию
        }

        // Получаем данные с бэкенда
        const response = await fetch(`/api/cars?${queryParams.toString()}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Не удалось загрузить данные автомобилей');
        }
        const data = await response.json();
        
        // Проверяем структуру ответа и извлекаем список автомобилей
        if (data.success && data.data && data.data.content) {
          setCars(data.data.content);
        } else if (data.success && Array.isArray(data.data)) {
          // Если API возвращает просто массив в data
          setCars(data.data);
        } else {
          console.warn('Неожиданная структура ответа API:', data);
          setCars([]);
        }

      } catch (err: any) {
        console.error('Ошибка при загрузке автомобилей:', err);
        setError(err.message || 'Не удалось загрузить данные автомобилей');
        setCars([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCars();
  }, [filters]);

  // Обработчики для взаимодействия с изображениями
  const handleImageMouseEnter = (car: Car) => {
    setHoveredCarId(car.id);
    setIsHovering(true);
    setHoveredPhotoIndex(0); // Сбрасываем индекс фото при наведении
  };
  
  const handleImageMouseLeave = () => {
    setIsHovering(false);
    setHoveredCarId(null);
    setHoveredPhotoIndex(0);
  };
  
  const handleImageMouseMove = (e: React.MouseEvent, car: Car) => {
    if (!car.photos || car.photos.length <= 1) return;
    
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    
    // Определяем индекс фото на основе положения курсора
    const photoCount = car.photos.length;
    const photoIndex = Math.min(
      Math.floor((x / width) * photoCount),
      photoCount - 1
    );
    
    setHoveredPhotoIndex(photoIndex);
  };
  
  // Обработчики для полноэкранного просмотра
  const handleOpenFullscreen = (car: Car, index: number = 0, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setFullscreenCar(car);
    setFullscreenPhotoIndex(index);
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
    // Проверяем fullscreenCar и fullscreenCar.photos перед использованием
    if (!fullscreenCar || !fullscreenCar.photos) return;

    setIsPhotoChanging(true);
    setTimeout(() => {
      // Повторная проверка внутри setTimeout для дополнительной безопасности
      if (!fullscreenCar || !fullscreenCar.photos) return;
      
      // Убедимся, что newIndex в допустимых границах
      const validIndex = Math.max(0, Math.min(newIndex, fullscreenCar.photos.length - 1));
      setFullscreenPhotoIndex(validIndex);
      setIsPhotoChanging(false);
    }, 200);
  };
  
  // Обработчик нажатия клавиш для навигации в полноэкранном режиме
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Убедимся, что fullscreenCar и photos существуют перед доступом к length
      if (!fullscreenMode || !fullscreenCar || !fullscreenCar.photos || fullscreenCar.photos.length <= 1) return;
      
      if (e.key === 'Escape') {
        handleCloseFullscreen();
      } else if (e.key === 'ArrowLeft') {
        // Доступ к length безопасен после проверки выше
        const newIndex = fullscreenPhotoIndex === 0 
          ? fullscreenCar.photos.length - 1 
          : fullscreenPhotoIndex - 1;
        handleChangeFullscreenPhoto(newIndex);
      } else if (e.key === 'ArrowRight') {
        // Доступ к length безопасен после проверки выше
        const newIndex = fullscreenPhotoIndex === fullscreenCar.photos.length - 1 
          ? 0 
          : fullscreenPhotoIndex + 1;
        handleChangeFullscreenPhoto(newIndex);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenMode, fullscreenCar, fullscreenPhotoIndex]);

  // Форматирование цены
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <>
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
                   onClick={() => onShowDetails(car)}>
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
                            isHovering && hoveredCarId === car.id && car.photos && car.photos.length > 0
                              ? car.photos[hoveredPhotoIndex].replace(/^\//, '')
                              : (car.mainPhotoUrl ? car.mainPhotoUrl.replace(/^\//, '') : '/car.png')
                          } 
                          className="img-fluid h-100 rounded-start" 
                          alt={`${car.make} ${car.model}`} 
                          style={{ 
                            objectFit: 'cover',
                            width: '100%',
                            minHeight: '220px',
                            maxHeight: '220px',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer'
                          }}
                          onError={(e) => {
                            console.error('Error loading image:', e.currentTarget.src);
                            e.currentTarget.src = '/car.png';
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleOpenFullscreen(car, hoveredPhotoIndex);
                          }}
                        />
                        {/* Индикатор количества фото */}
                        {car.photos && car.photos.length > 1 && (
                          <div className="position-absolute top-0 end-0 m-2">
                            <button 
                              className="btn btn-dark btn-sm rounded-pill opacity-75"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenFullscreen(car);
                              }}
                            >
                              <i className="bi bi-images me-1"></i>
                              {car.photos.length}
                            </button>
                          </div>
                        )}
                        
                        {/* Бейдж "Можем привезти" - ОСТАВЛЯЕМ, так как вкладка называется CanDeliverTab */}
                        <div className="position-absolute top-0 start-0 m-2">
                          <span className="badge bg-warning text-dark rounded-pill px-3 py-2 shadow-sm">
                            <i className="bi bi-truck me-1"></i>
                            Можем привезти
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Информация об авто */}
                    <div className="col-md-8">
                      <div className="card-body h-100 d-flex flex-column">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h5 className="card-title mb-0 fw-bold">{car.make} {car.model}</h5>
                          <span className="badge bg-primary rounded-pill">{car.year} г.</span>
                        </div>
                        
                        <p className="card-text text-primary fw-bold fs-4 mb-2">
                          {formatPrice(car.price)}
                        </p>
                        
                        <div className="car-specs mb-3">
                          <div className="d-flex flex-wrap gap-3">
                            {car.mileage !== undefined && (
                              <div className="spec-item d-flex align-items-center">
                                <i className="bi bi-speedometer2 me-2 text-muted"></i>
                                <span>{car.mileage.toLocaleString()} км</span>
                              </div>
                            )}
                            <div className="spec-item d-flex align-items-center">
                              <i className="bi bi-fuel-pump me-2 text-muted"></i>
                              <span>{car.technicalSpec.fuelType}</span>
                            </div>
                            <div className="spec-item d-flex align-items-center">
                              <i className="bi bi-gear me-2 text-muted"></i>
                              {/* Используем transmissionType из technicalSpec */}
                              <span>{car.technicalSpec.transmissionType}</span> 
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-auto">
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="location d-flex align-items-center text-muted small">
                              <i className="bi bi-geo-alt me-1"></i>
                              <span>{car.location}</span>
                            </div>
                            {/* Удаляем указание источника "Авто.ру" */}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Сетка
                  <>
                    <div 
                      className="position-relative"
                      onMouseMove={(e) => handleImageMouseMove(e, car)}
                      onMouseEnter={() => handleImageMouseEnter(car)}
                      onMouseLeave={handleImageMouseLeave}
                    >
                      <img 
                        src={
                          isHovering && hoveredCarId === car.id && car.photos && car.photos.length > 0
                            ? car.photos[hoveredPhotoIndex].replace(/^\//, '')
                            : (car.mainPhotoUrl ? car.mainPhotoUrl.replace(/^\//, '') : '/car.png')
                        } 
                        className="card-img-top" 
                        alt={`${car.make} ${car.model}`} 
                        style={{ 
                          height: '200px', 
                          objectFit: 'cover',
                          transition: 'all 0.3s ease'
                        }}
                        onError={(e) => {
                          console.error('Error loading image:', e.currentTarget.src);
                          e.currentTarget.src = '/car.png';
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleOpenFullscreen(car, hoveredPhotoIndex);
                        }}
                      />
                      
                      {/* Индикатор количества фото */}
                      {car.photos && car.photos.length > 1 && (
                        <div className="position-absolute top-0 end-0 m-2">
                          <button 
                            className="btn btn-dark btn-sm rounded-pill opacity-75"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenFullscreen(car);
                            }}
                          >
                            <i className="bi bi-images me-1"></i>
                            {car.photos.length}
                          </button>
                        </div>
                      )}
                      
                      {/* Бейдж "Можем привезти" */}
                      <div className="position-absolute top-0 start-0 m-2">
                        <span className="badge bg-warning text-dark rounded-pill px-3 py-2 shadow-sm">
                          <i className="bi bi-truck me-1"></i>
                          Можем привезти
                        </span>
                      </div>
                    </div>
                    
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="card-title mb-0 fw-bold">{car.make} {car.model}</h5>
                        <span className="badge bg-primary rounded-pill">{car.year} г.</span>
                      </div>
                      
                      <p className="card-text text-primary fw-bold fs-4 mb-2">
                        {formatPrice(car.price)}
                      </p>
                      
                      <div className="car-specs mb-3">
                        <div className="d-flex flex-wrap gap-2">
                          {car.mileage !== undefined && (
                            <div className="spec-item d-flex align-items-center">
                              <i className="bi bi-speedometer2 me-1 text-muted"></i>
                              <span className="small">{car.mileage.toLocaleString()} км</span>
                            </div>
                          )}
                          <div className="spec-item d-flex align-items-center">
                            <i className="bi bi-fuel-pump me-1 text-muted"></i>
                            <span className="small">{car.technicalSpec.fuelType}</span>
                          </div>
                          <div className="spec-item d-flex align-items-center">
                            <i className="bi bi-gear me-1 text-muted"></i>
                            {/* Используем transmissionType из technicalSpec */}
                            <span className="small">{car.technicalSpec.transmissionType}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="d-flex justify-content-between align-items-center mt-auto">
                        <div className="location d-flex align-items-center text-muted small">
                          <i className="bi bi-geo-alt me-1"></i>
                          <span>{car.location}</span>
                        </div>
                        {/* Удаляем указание источника "Авто.ру" */}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Полноэкранный просмотр фотографий */}
      {fullscreenMode && fullscreenCar && (
        <div 
          className="fullscreen-overlay position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 9999,
            opacity: 1,
            transition: 'opacity 0.3s ease'
          }}
          onClick={handleFullscreenBackgroundClick}
        >
          <div className="position-relative" style={{ maxWidth: '90%', maxHeight: '90%' }}>
            {/* Проверяем наличие photos перед рендерингом img */}
            {fullscreenCar.photos && fullscreenCar.photos.length > 0 ? (
              <img 
                src={fullscreenCar.photos[fullscreenPhotoIndex]} 
                alt={`${fullscreenCar.make} ${fullscreenCar.model}`}
                className="img-fluid"
                style={{
                  maxHeight: '85vh',
                  opacity: isPhotoChanging ? 0 : 1,
                  transition: 'opacity 0.2s ease'
                }}
              />
            ) : (
              <div className="text-white">Нет доступных фото</div>
            )}
            
            {/* Кнопки навигации: Добавляем проверку photos перед доступом к length */}
            {fullscreenCar.photos && fullscreenCar.photos.length > 1 && (
              <>
                <button 
                  className="btn btn-dark position-absolute top-50 start-0 translate-middle-y rounded-circle"
                  style={{ width: '50px', height: '50px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Добавляем проверку внутри обработчика
                    if (!fullscreenCar || !fullscreenCar.photos) return;
                    const newIndex = fullscreenPhotoIndex === 0 
                      ? fullscreenCar.photos.length - 1 
                      : fullscreenPhotoIndex - 1;
                    handleChangeFullscreenPhoto(newIndex);
                  }}
                >
                  <i className="bi bi-chevron-left"></i>
                </button>
                <button 
                  className="btn btn-dark position-absolute top-50 end-0 translate-middle-y rounded-circle"
                  style={{ width: '50px', height: '50px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Добавляем проверку внутри обработчика
                    if (!fullscreenCar || !fullscreenCar.photos) return;
                    const newIndex = fullscreenPhotoIndex === fullscreenCar.photos.length - 1 
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
              className="btn btn-dark position-absolute top-0 end-0 m-3 rounded-circle"
              style={{ width: '40px', height: '40px' }}
              onClick={handleCloseFullscreen}
            >
              <i className="bi bi-x-lg"></i>
            </button>
            
            {/* Индикатор фотографий: Добавляем проверку photos перед доступом к length */}
            {fullscreenCar.photos && fullscreenCar.photos.length > 1 && (
              <div className="position-absolute bottom-0 start-50 translate-middle-x mb-4">
                <div className="d-flex gap-2">
                  {fullscreenCar.photos.map((_, index) => (
                    <button 
                      key={index}
                      className={`btn btn-sm rounded-circle ${index === fullscreenPhotoIndex ? 'btn-light' : 'btn-dark'}`}
                      style={{ width: '12px', height: '12px', padding: 0 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChangeFullscreenPhoto(index);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CanDeliverTab;

