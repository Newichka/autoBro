import React, { useState, useEffect } from 'react';

// Типы для справочников
interface BodyType {
  id: number;
  name: string;
}

interface Color {
  id: number;
  name: string;
  hexCode: string;
}

// Тип для марок и моделей, которые могут быть строками или объектами с определенной структурой
type MakeModel = string | { id?: number; name?: string; [key: string]: any };

// Фильтр для поиска автомобилей
interface CarFilter {
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

const Filter: React.FC<FilterProps> = ({ 
  filters, 
  selectedMake,
  makes,
  models,
  bodyTypes,
  colors,
  fuelTypes,
  transmissionTypes,
  driveTypes,
  onChange,
  onFilterChange,
  onApply,
  onReset,
  onResetFilters,
  viewMode,
  onViewModeChange,
  onSortChange,
  sortOrder,
  onSearch,
  searchQuery,
  parserErrorOccurred
}) => {
  // Состояние для показа всех параметров
  const [showAllParams, setShowAllParams] = useState(false);
  
  // Состояние для мультивыбора
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  // Подсчет активных фильтров
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Закрытие выпадающих списков при клике вне их области
  useEffect(() => {
    const handleClickOutside = (event: PointerEvent) => {
      // Если нет открытого выпадающего списка, ничего не делаем
      if (!openDropdown) return;
      
      const target = event.target as HTMLElement;
      
      // Проверяем, не находится ли клик внутри какого-либо выпадающего списка
      // или на кнопке, которая его открывает
      const clickedElement = target.closest('.dropdown-container');
      
      // Если клик был внутри контейнера текущего открытого выпадающего списка,
      // то оставляем его открытым, иначе закрываем
      if (!clickedElement || clickedElement.getAttribute('data-dropdown') !== openDropdown) {
        setOpenDropdown(null);
      }
    };
    
    // Используем event capturing для гарантированного перехвата событий
    document.addEventListener('pointerdown', handleClickOutside, true);
    
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside, true);
    };
  }, [openDropdown]);

  // Обновление счетчика активных фильтров
  useEffect(() => {
    let count = 0;
    
    if (filters.make && filters.make.length > 0) count++;
    if (filters.model && filters.model.length > 0) count++;
    if (filters.bodyTypeId && filters.bodyTypeId.length > 0) count++;
    if (filters.fuelType && filters.fuelType.length > 0) count++;
    if (filters.minHorsePower) count++;
    if (filters.transmissionType && filters.transmissionType.length > 0) count++;
    if (filters.driveType && filters.driveType.length > 0) count++;
    if (filters.minYear) count++;
    if (filters.maxYear) count++;
    if (filters.minPrice) count++;
    if (filters.maxPrice) count++;
    if (filters.maxMileage) count++;
    if (filters.colorId && filters.colorId.length > 0) count++;
    if (filters.country) count++;
    if (filters.city) count++;
    
    setActiveFiltersCount(count);
  }, [filters]);
  
  // Функция для обработки мультивыбора
  const handleMultiSelect = (type: string, value: string | number) => {
    const currentValues = filters[type as keyof CarFilter] || [];
    
    let newValues;
    if (Array.isArray(currentValues)) {
      // Если значение уже есть в массиве, удаляем его
      if (currentValues.includes(value as never)) {
        newValues = currentValues.filter(item => item !== value);
      } else {
        // Иначе добавляем
        newValues = [...currentValues, value];
      }
    } else {
      // Если текущее значение не массив, создаем новый массив с выбранным значением
      newValues = [value];
    }
    
    onFilterChange(type as keyof CarFilter, newValues);
  };
  
  // Переключение состояния выпадающего списка
  const toggleDropdown = (dropdown: string) => {
    if (openDropdown === dropdown) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(dropdown);
    }
  };

  // Проверка выбрано ли значение
  const isSelected = (type: string, value: string | number) => {
    const values = filters[type as keyof CarFilter];
    if (Array.isArray(values)) {
      return values.includes(value as never);
    }
    return false;
  };

  // Функция для получения отображаемого значения для выпадающего списка
  const getDropdownTitle = (type: keyof CarFilter, defaultText: string) => {
    const values = filters[type];
    if (Array.isArray(values) && values.length > 0) {
      if (values.length === 1) {
        // Для одного выбранного значения показываем его название
        let displayText = '';
        
        if (type === 'bodyTypeId' && typeof values[0] === 'number') {
          const bodyType = bodyTypes.find(bt => bt.id === values[0]);
          displayText = bodyType ? bodyType.name : values[0].toString();
        } else {
          displayText = values[0].toString();
        }
        
        // Если название слишком длинное, сокращаем его
        if (displayText.length > 15) {
          displayText = displayText.substring(0, 12) + '...';
        }
        
        return displayText;
      } else {
        // Для нескольких значений показываем счетчик
        return `${defaultText.split(' ')[0]} (${values.length})`;
      }
    }
    return defaultText;
  };

  return (
    <div className="filter-container bg-white p-3 rounded shadow-sm mb-4">
      {/* Поиск и режим отображения */}
      <div className="row mb-3">
        <div className="col-md-6">
          {/* Удаляю блок поиска по марке, модели */}
        </div>
      </div>

      {/* Первый ряд фильтров: Марка, Модель, Кузов */}
      <div className="row mb-3">
        {/* Селект марки с мультивыбором */}
        <div className="col-md-4 position-relative dropdown-container" data-dropdown="make">
          <div 
            className={`form-select d-flex justify-content-between align-items-center ${openDropdown === 'make' ? 'active-dropdown' : ''}`}
            onClick={() => toggleDropdown('make')}
            style={{ cursor: 'pointer' }}
          >
            {getDropdownTitle('make', 'Марка')}
          </div>
          
          {openDropdown === 'make' && (
            <div className="position-absolute start-0 w-100 bg-white shadow rounded mt-1 z-index-dropdown">
              <div className="filter-item border-bottom text-primary" onClick={() => onFilterChange('make', [])}>
                <span className="filter-check me-2">
                  {filters.make?.length === 0 && <i className="bi bi-check2"></i>}
                </span>
                <span>Любая</span>
              </div>
              
              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                {makes
                  .filter(make => {
                    if (typeof make === 'string') {
                      return make.trim().length > 0;
                    } else if (make && typeof make === 'object') {
                      if ('name' in make && typeof make.name === 'string' && make.name.trim().length > 0) {
                        return true;
                      }
                      
                      for (const key in make) {
                        if (typeof make[key] === 'string' && make[key].trim().length > 0) {
                          return true;
                        }
                      }
                      return false;
                    }
                    return false;
                  })
                  .map((make, index) => {
                    let displayValue = '';
                    let displayName = '';
                    
                    if (typeof make === 'string') {
                      displayValue = make;
                      displayName = make;
                    } else if (make && typeof make === 'object') {
                      if ('id' in make && 'name' in make && typeof make.name === 'string') {
                        displayValue = make.name;
                        displayName = make.name;
                      } else {
                        for (const key in make) {
                          if (typeof make[key] === 'string' && make[key].length > 0) {
                            displayValue = make[key];
                            displayName = make[key];
                            break;
                          }
                        }
                        
                        if (!displayValue) {
                          displayValue = 'Марка ' + (index + 1);
                          displayName = 'Марка ' + (index + 1);
                        }
                      }
                    }
                    
                    return (
                      <div 
                        key={index} 
                        className="filter-item"
                        onClick={() => handleMultiSelect('make', displayValue)}
                      >
                        <span className="filter-check me-2">
                          {isSelected('make', displayValue) && <i className="bi bi-check2"></i>}
                        </span>
                        <span>{displayName}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
        
        {/* Модель */}
        <div className="col-md-4 position-relative dropdown-container" data-dropdown="model">
          <div 
            className={`form-select d-flex justify-content-between align-items-center ${openDropdown === 'model' ? 'active-dropdown' : ''} ${!filters.make || filters.make.length === 0 ? 'text-muted' : ''}`}
            onClick={() => filters.make && filters.make.length > 0 ? toggleDropdown('model') : null}
            style={{ cursor: filters.make && filters.make.length > 0 ? 'pointer' : 'not-allowed' }}
          >
            {getDropdownTitle('model', 'Модель')}
          </div>
          
          {openDropdown === 'model' && (
            <div className="position-absolute start-0 w-100 bg-white shadow rounded mt-1 z-index-dropdown">
              <div className="filter-item border-bottom text-primary" onClick={() => onFilterChange('model', [])}>
                <span className="filter-check me-2">
                  {!filters.model || filters.model.length === 0 && <i className="bi bi-check2"></i>}
                </span>
                <span>Любая</span>
              </div>
              
              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                {models.length > 0 ? (
                  models.map((model, index) => {
                    // Преобразуем модель в строку для отображения
                    const modelStr = typeof model === 'string' ? model : (model.name || String(model) || 'Неизвестно');
                    return (
                      <div 
                        key={index} 
                        className="filter-item"
                        onClick={() => handleMultiSelect('model', modelStr)}
                      >
                        <span className="filter-check me-2">
                          {isSelected('model', modelStr) && <i className="bi bi-check2"></i>}
                        </span>
                        <span>{modelStr}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="filter-item text-muted">Нет доступных моделей</div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Селект типа кузова с мультивыбором */}
        <div className="col-md-4 position-relative dropdown-container" data-dropdown="bodyTypeId">
          <div 
            className={`form-select d-flex justify-content-between align-items-center ${openDropdown === 'bodyTypeId' ? 'active-dropdown' : ''}`}
            onClick={() => toggleDropdown('bodyTypeId')}
            style={{ cursor: 'pointer' }}
          >
            {getDropdownTitle('bodyTypeId', 'Кузов')}
          </div>
          
          {openDropdown === 'bodyTypeId' && (
            <div className="position-absolute start-0 w-100 bg-white shadow rounded mt-1 z-index-dropdown">
              <div className="filter-item border-bottom text-primary" onClick={() => onFilterChange('bodyTypeId', [])}>
                <span className="filter-check me-2">
                  {filters.bodyTypeId?.length === 0 && <i className="bi bi-check2"></i>}
                </span>
                <span>Любой</span>
              </div>
              
              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                {bodyTypes.map((type) => (
                  <div 
                    key={type.id} 
                    className="filter-item"
                    onClick={() => handleMultiSelect('bodyTypeId', type.id)}
                  >
                    <span className="filter-check me-2">
                      {isSelected('bodyTypeId', type.id) && <i className="bi bi-check2"></i>}
                    </span>
                    <span>{type.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Второй ряд фильтров: коробка передач, двигатель, привод */}
      <div className="row mb-3">
        {/* Трансмиссия */}
        <div className="col-md-4 position-relative dropdown-container" data-dropdown="transmissionType">
          <div 
            className={`form-select d-flex justify-content-between align-items-center ${openDropdown === 'transmissionType' ? 'active-dropdown' : ''}`}
            onClick={() => toggleDropdown('transmissionType')}
            style={{ cursor: 'pointer' }}
          >
            {getDropdownTitle('transmissionType', 'Коробка передач')}
          </div>
          
          {openDropdown === 'transmissionType' && (
            <div className="position-absolute start-0 w-100 bg-white shadow rounded mt-1 z-index-dropdown">
              <div className="filter-item border-bottom text-primary" onClick={() => onFilterChange('transmissionType', [])}>
                <span className="filter-check me-2">
                  {filters.transmissionType?.length === 0 && <i className="bi bi-check2"></i>}
                </span>
                <span>Любая</span>
              </div>
              
              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                {transmissionTypes.map((type, index) => (
                  <div 
                    key={index} 
                    className="filter-item"
                    onClick={() => handleMultiSelect('transmissionType', type)}
                  >
                    <span className="filter-check me-2">
                      {isSelected('transmissionType', type) && <i className="bi bi-check2"></i>}
                    </span>
                    <span>{type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Тип топлива */}
        <div className="col-md-4 position-relative dropdown-container" data-dropdown="fuelType">
          <div 
            className={`form-select d-flex justify-content-between align-items-center ${openDropdown === 'fuelType' ? 'active-dropdown' : ''}`}
            onClick={() => toggleDropdown('fuelType')}
            style={{ cursor: 'pointer' }}
          >
            {getDropdownTitle('fuelType', 'Двигатель')}
          </div>
          
          {openDropdown === 'fuelType' && (
            <div className="position-absolute start-0 w-100 bg-white shadow rounded mt-1 z-index-dropdown">
              <div className="filter-item border-bottom text-primary" onClick={() => onFilterChange('fuelType', [])}>
                <span className="filter-check me-2">
                  {filters.fuelType?.length === 0 && <i className="bi bi-check2"></i>}
                </span>
                <span>Любой</span>
              </div>
              
              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                {fuelTypes.map((type, index) => (
                  <div 
                    key={index} 
                    className="filter-item"
                    onClick={() => handleMultiSelect('fuelType', type)}
                  >
                    <span className="filter-check me-2">
                      {isSelected('fuelType', type) && <i className="bi bi-check2"></i>}
                    </span>
                    <span>{type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Привод */}
        <div className="col-md-4 position-relative dropdown-container" data-dropdown="driveType">
          <div 
            className={`form-select d-flex justify-content-between align-items-center ${openDropdown === 'driveType' ? 'active-dropdown' : ''}`}
            onClick={() => toggleDropdown('driveType')}
            style={{ cursor: 'pointer' }}
          >
            {getDropdownTitle('driveType', 'Привод')}
          </div>
          
          {openDropdown === 'driveType' && (
            <div className="position-absolute start-0 w-100 bg-white shadow rounded mt-1 z-index-dropdown">
              <div className="filter-item border-bottom text-primary" onClick={() => onFilterChange('driveType', [])}>
                <span className="filter-check me-2">
                  {filters.driveType?.length === 0 && <i className="bi bi-check2"></i>}
                </span>
                <span>Любой</span>
              </div>
              
              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                {driveTypes.map((type, index) => (
                  <div 
                    key={index} 
                    className="filter-item"
                    onClick={() => handleMultiSelect('driveType', type)}
                  >
                    <span className="filter-check me-2">
                      {isSelected('driveType', type) && <i className="bi bi-check2"></i>}
                    </span>
                    <span>{type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Третий ряд диапазонов: год, пробег, цена */}
      <div className="row mb-3">
        <div className="col-md-4">
          <div className="input-group">
            <select 
              className="form-select" 
              id="minYear" 
              name="minYear"
              value={filters.minYear || ''}
              onChange={onChange}
            >
              <option value="">Год от</option>
              {[...Array(30)].map((_, i) => {
                const year = new Date().getFullYear() - i;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
            <select 
              className="form-select" 
              id="maxYear" 
              name="maxYear"
              value={filters.maxYear || ''}
              onChange={onChange}
            >
              <option value="">до</option>
              {[...Array(30)].map((_, i) => {
                const year = new Date().getFullYear() - i;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
          </div>
        </div>
          
        <div className="col-md-4">
          <div className="input-group">
            <input 
              type="number" 
              className="form-control" 
              placeholder="Пробег от, км" 
              id="minMileage" 
              name="minMileage"
              value={filters.minMileage || ''}
              onChange={onChange}
              min="0"
            />
            <input 
              type="number" 
              className="form-control" 
              placeholder="до" 
              id="maxMileage" 
              name="maxMileage"
              value={filters.maxMileage || ''}
              onChange={onChange}
              min="0"
            />
          </div>
        </div>
          
        <div className="col-md-4">
          <div className="input-group">
            <input 
              type="number" 
              className="form-control" 
              placeholder="Цена от, ₽" 
              id="minPrice" 
              name="minPrice"
              value={filters.minPrice || ''}
              onChange={onChange}
              min="0"
            />
            <input 
              type="number" 
              className="form-control" 
              placeholder="до" 
              id="maxPrice" 
              name="maxPrice"
              value={filters.maxPrice || ''}
              onChange={onChange}
              min="0"
            />
          </div>
        </div>
      </div>
          
      {/* Дополнительные параметры (показываются при нажатии на "Все параметры") */}
      {showAllParams && (
        <div className="row mb-3">
          {/* Цвет */}
          <div className="col-md-4 position-relative dropdown-container" data-dropdown="colorId">
            <div 
              className={`form-select d-flex justify-content-between align-items-center ${openDropdown === 'colorId' ? 'active-dropdown' : ''}`}
              onClick={() => toggleDropdown('colorId')}
              style={{ cursor: 'pointer' }}
            >
              {getDropdownTitle('colorId', 'Цвет')}
            </div>
            
            {openDropdown === 'colorId' && (
              <div className="position-absolute start-0 w-100 bg-white shadow rounded mt-1 z-index-dropdown">
                <div className="filter-item border-bottom text-primary" onClick={() => onFilterChange('colorId', [])}>
                  <span className="filter-check me-2">
                    {filters.colorId?.length === 0 && <i className="bi bi-check2"></i>}
                  </span>
                  <span>Любой</span>
                </div>
                
                <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  {colors.map((color) => (
                    <div key={color.id} className="form-check filter-item">
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id={`color-${color.id}`}
                        checked={isSelected('colorId', color.id)}
                        onChange={() => handleMultiSelect('colorId', color.id)}
                      />
                      <label className="form-check-label" htmlFor={`color-${color.id}`}>
                        <span 
                          className="d-inline-block me-2" 
                          style={{ 
                            width: '16px', 
                            height: '16px', 
                            backgroundColor: color.hexCode,
                            border: '1px solid #ccc',
                            borderRadius: '3px',
                            verticalAlign: 'middle'
                          }}
                        ></span>
                        {color.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="col-md-4">
            <input 
              type="number" 
              className="form-control" 
              placeholder="Мощность от, л.с." 
              id="minHorsePower" 
              name="minHorsePower"
              value={filters.minHorsePower || ''}
              onChange={onChange}
              min="0"
            />
          </div>
          
          <div className="col-md-4">
            <input 
              type="text" 
              className="form-control" 
              placeholder="Город" 
              id="city" 
              name="city"
              value={filters.city || ''}
              onChange={onChange} 
            />
          </div>
        </div>
      )}
      
      {/* Кнопки действий */}
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <button 
            type="button" 
            className="btn btn-link text-decoration-none" 
            style={{ color: 'var(--primary-light)' }}
            onClick={() => setShowAllParams(!showAllParams)}
          >
            {showAllParams ? 
              <><i className="bi bi-chevron-up"></i> Свернуть параметры</> : 
              <><i className="bi bi-sliders"></i> Все параметры</>
            }
          </button>
          
          {activeFiltersCount > 0 && (
            <button 
              className="btn btn-link text-decoration-none ms-3" 
              style={{ color: 'var(--accent)' }}
              onClick={onReset}
            >
              <i className="bi bi-x-circle"></i> Сбросить
            </button>
          )}
        </div>
        
        <button 
          className="btn px-4 shadow-sm"
          style={{ 
            backgroundColor: 'var(--accent)',
            color: 'white',
            borderColor: 'var(--accent)'
          }}
          onClick={onApply}
        >
          <i className="bi bi-search me-2"></i>
          Показать {activeFiltersCount > 0 ? 'подходящие' : 'все'} предложения
        </button>
      </div>
      
      {/* Стили для оформления выпадающих списков */}
      <style>
        {`
          .filter-container {
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
            border: none;
          }
          .filter-item {
            padding: 8px 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            border-bottom: 1px solid #f0f0f0;
            transition: all 0.2s ease;
          }
          .filter-item:hover {
            background-color: rgba(214, 64, 69, 0.05);
          }
          .filter-check {
            width: 20px;
            display: inline-block;
          }
          .z-index-dropdown {
            z-index: 1000;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            border-radius: 8px;
          }
          .filter-item:last-child {
            border-bottom: none;
          }
          .filter-item i {
            color: var(--accent);
          }
          .active-dropdown {
            border-color: var(--accent-light);
            outline: 0;
            box-shadow: 0 0 0 0.25rem rgba(214, 64, 69, 0.25);
          }
          .dropdown-container {
            margin-bottom: 0.5rem;
          }
          .disabled-select {
            background-color: #e9ecef;
            opacity: 0.65;
            pointer-events: none;
          }
          .form-select, .form-control {
            border-radius: 6px;
            border: 1px solid #dee2e6;
            transition: all 0.2s ease;
          }
          .form-select:hover, .form-control:hover {
            border-color: var(--accent-light);
          }
        `}
      </style>
    </div>
  );
};

export default Filter;
