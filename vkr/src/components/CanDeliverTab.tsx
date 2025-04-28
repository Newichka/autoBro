import React, { useState, useEffect } from 'react';
import autoRuParser, { AutoRuCar, AutoRuParams } from '../services/AutoRuParser';

// Интерфейс для пропсов компонента
interface CanDeliverTabProps {
  filters: any; // Используем тип из MainContainer
  viewMode: 'grid' | 'list';
  onShowDetails: (car: AutoRuCar) => void;
}

const CanDeliverTab: React.FC<CanDeliverTabProps> = ({ filters, viewMode, onShowDetails }) => {
  // Состояние для хранения автомобилей с Авто.ру
  const [cars, setCars] = useState<AutoRuCar[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Состояние для отслеживания наведения на изображение
  const [hoveredCarId, setHoveredCarId] = useState<number | null>(null);
  const [hoveredPhotoIndex, setHoveredPhotoIndex] = useState<number>(0);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  
  // Состояние для полноэкранного просмотра
  const [fullscreenMode, setFullscreenMode] = useState<boolean>(false);
  const [fullscreenCar, setFullscreenCar] = useState<AutoRuCar | null>(null);
  const [fullscreenPhotoIndex, setFullscreenPhotoIndex] = useState<number>(0);
  const [isPhotoChanging, setIsPhotoChanging] = useState<boolean>(false);

  // Загрузка автомобилей с Авто.ру при изменении фильтров
  useEffect(() => {
    const fetchCars = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Преобразуем фильтры из формата приложения в формат для Авто.ру
        const autoRuParams: AutoRuParams = {
          make: filters.make,
          model: filters.model,
          minYear: filters.minYear,
          maxYear: filters.maxYear,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          minMileage: filters.minMileage,
          maxMileage: filters.maxMileage,
          bodyType: filters.bodyTypeId?.map((id: number) => {
            // Здесь можно добавить преобразование ID в названия типов кузова
            // Для простоты используем заглушку
            const bodyTypeMap: Record<number, string> = {
              1: 'Седан',
              2: 'Хэтчбек',
              3: 'Универсал',
              4: 'Внедорожник',
              5: 'Кроссовер'
            };
            return bodyTypeMap[id] || '';
          }).filter((type: string) => type !== ''),
          fuelType: filters.fuelType,
          minHorsePower: filters.minHorsePower,
          transmissionType: filters.transmissionType,
          driveType: filters.driveType,
          color: filters.colorId?.map((id: number) => {
            // Преобразование ID в названия цветов
            const colorMap: Record<number, string> = {
              1: 'Черный',
              2: 'Белый',
              3: 'Серый',
              4: 'Красный',
              5: 'Синий'
            };
            return colorMap[id] || '';
          }).filter((color: string) => color !== ''),
          page: filters.page,
          pageSize: filters.size
        };
        
        // Получаем данные с Авто.ру (через наш парсер)
        const autoRuCars = await autoRuParser.fetchCars(autoRuParams);
        setCars(autoRuCars);
      } catch (err) {
        console.error('Ошибка при загрузке автомобилей с Авто.ру:', err);
        setError('Не удалось загрузить данные с Авто.ру');
        setCars([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCars();
  }, [filters]);

  // Обработчики для взаимодействия с изображениями
  const handleImageMouseEnter = (car: AutoRuCar) => {
    setHoveredCarId(car.id);
    setIsHovering(true);
  };
  
  const handleImageMouseLeave = () => {
    setIsHovering(false);
  };
  
  const handleImageMouseMove = (e: React.MouseEvent, car: AutoRuCar) => {
    if (!car.allPhotoUrls || car.allPhotoUrls.length <= 1) return;
    
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    
    // Определяем индекс фото на основе положения курсора
    const photoCount = car.allPhotoUrls.length;
    const photoIndex = Math.min(
      Math.floor((x / width) * photoCount),
      photoCount - 1
    );
    
    setHoveredPhotoIndex(photoIndex);
  };
  
  // Обработчики для полноэкранного просмотра
  const handleOpenFullscreen = (car: AutoRuCar, index: number = 0, e?: React.MouseEvent) => {
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
          По вашему запросу не найдено автомобилей на Авто.ру. Попробуйте изменить параметры фильтрации.
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
                            maxHeight: '220px',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer'
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
                              <i className="bi bi-images me-1"></i>
                              {car.allPhotoUrls.length}
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
                            <div className="spec-item d-flex align-items-center">
                              <i className="bi bi-speedometer2 me-2 text-muted"></i>
                              <span>{car.mileage.toLocaleString()} км</span>
                            </div>
                            <div className="spec-item d-flex align-items-center">
                              <i className="bi bi-fuel-pump me-2 text-muted"></i>
                              <span>{car.technicalSpec.fuelType}</span>
                            </div>
                            <div className="spec-item d-flex align-items-center">
                              <i className="bi bi-gear me-2 text-muted"></i>
                              <span>{car.transmissionInfo}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-auto">
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="location d-flex align-items-center text-muted small">
                              <i className="bi bi-geo-alt me-1"></i>
                              <span>{car.location}</span>
                            </div>
                            <div className="source d-flex align-items-center text-muted small">
                              <i className="bi bi-link-45deg me-1"></i>
                              <span>Авто.ру</span>
                            </div>
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
                          isHovering && hoveredCarId === car.id && car.allPhotoUrls && car.allPhotoUrls.length > 0
                            ? car.allPhotoUrls[hoveredPhotoIndex]
                            : (car.mainPhotoUrl || 'https://via.placeholder.com/300x200?text=Нет+фото')
                        } 
                        className="card-img-top" 
                        alt={`${car.make} ${car.model}`} 
                        style={{ 
                          height: '200px', 
                          objectFit: 'cover',
                          transition: 'all 0.3s ease'
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
                            <i className="bi bi-images me-1"></i>
                            {car.allPhotoUrls.length}
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
                          <div className="spec-item d-flex align-items-center">
                            <i className="bi bi-speedometer2 me-1 text-muted"></i>
                            <span className="small">{car.mileage.toLocaleString()} км</span>
                          </div>
                          <div className="spec-item d-flex align-items-center">
                            <i className="bi bi-fuel-pump me-1 text-muted"></i>
                            <span className="small">{car.technicalSpec.fuelType}</span>
                          </div>
                          <div className="spec-item d-flex align-items-center">
                            <i className="bi bi-gear me-1 text-muted"></i>
                            <span className="small">{car.transmissionInfo}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="d-flex justify-content-between align-items-center mt-auto">
                        <div className="location d-flex align-items-center text-muted small">
                          <i className="bi bi-geo-alt me-1"></i>
                          <span>{car.location}</span>
                        </div>
                        <div className="source d-flex align-items-center text-muted small">
                          <i className="bi bi-link-45deg me-1"></i>
                          <span>Авто.ру</span>
                        </div>
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
            <img 
              src={fullscreenCar.allPhotoUrls[fullscreenPhotoIndex]} 
              alt={`${fullscreenCar.make} ${fullscreenCar.model}`}
              className="img-fluid"
              style={{
                maxHeight: '85vh',
                opacity: isPhotoChanging ? 0 : 1,
                transition: 'opacity 0.2s ease'
              }}
            />
            
            {/* Кнопки навигации */}
            {fullscreenCar.allPhotoUrls.length > 1 && (
              <>
                <button 
                  className="btn btn-dark position-absolute top-50 start-0 translate-middle-y rounded-circle"
                  style={{ width: '50px', height: '50px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    const newIndex = fullscreenPhotoIndex === 0 
                      ? fullscreenCar.allPhotoUrls.length - 1 
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
                    const newIndex = fullscreenPhotoIndex === fullscreenCar.allPhotoUrls.length - 1 
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
            
            {/* Индикатор фотографий */}
            {fullscreenCar.allPhotoUrls.length > 1 && (
              <div className="position-absolute bottom-0 start-50 translate-middle-x mb-4">
                <div className="d-flex gap-2">
                  {fullscreenCar.allPhotoUrls.map((_, index) => (
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
