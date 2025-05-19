import React, { useState } from 'react';

interface TechnicalSpecDTO {
  fuelType: string;
  engineVolume?: number;
  horsePower?: number;
  driveType: string;
  transmissionType: string;
  engineInfo?: string;
  transmissionInfo?: string;
  gears?: number;
}

// Updated to include hexCode for color information
interface ColorData {
  name: string;
  hexCode: string;
}

interface CarDTO {
  make: string;
  model: string;
  year: number;
  bodyTypeName: string;
  price: number;
  mileage?: number;
  engineInfo?: string;
  transmissionInfo?: string;
  colorName: string; // This will be the name of the color
  colorHexCode: string; // This will be the hex_code for the color
  condition: string;
  location: string;
  mainPhotoUrl?: string;
  allPhotoUrls?: string[];
  safetyFeatures?: string[];
  equipment?: string[];
  technicalSpec: TechnicalSpecDTO;
}

interface AddCarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCarAdded: (car: CarDTO) => void; // Consider if the full DTO is needed here or just an ID/success message
}

const AddCarModal: React.FC<AddCarModalProps> = ({ isOpen, onClose, onCarAdded }) => {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number | ''>('');
  const [bodyTypeName, setBodyTypeName] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [mileage, setMileage] = useState<number | ''>('');
  const [engineInfoState, setEngineInfoState] = useState(''); // Renamed to avoid conflict with DTO field name
  const [transmissionInfoState, setTransmissionInfoState] = useState(''); // Renamed to avoid conflict
  const [colorName, setColorName] = useState('');
  const [colorHexCode, setColorHexCode] = useState(''); // New state for hex_code
  const [condition, setCondition] = useState('');
  const [location, setLocation] = useState('');
  const [mainPhotoUrl, setMainPhotoUrl] = useState('');
  
  const [fuelType, setFuelType] = useState('');
  const [engineVolume, setEngineVolume] = useState<number | ''>('');
  const [horsePower, setHorsePower] = useState<number | ''>('');
  const [driveType, setDriveType] = useState('');
  const [transmissionTypeSpec, setTransmissionTypeSpec] = useState(''); // Renamed to avoid conflict
  const [gears, setGears] = useState<number | ''>('');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    // Updated validation to include colorHexCode
    if (!make || !model || year === '' || !bodyTypeName || price === '' || !colorName || !colorHexCode || !condition || !location || !fuelType || !driveType || !transmissionTypeSpec) {
      setError('Пожалуйста, заполните все обязательные поля, включая название цвета и его HEX-код.');
      setIsLoading(false);
      return;
    }
    
    // Validate hex_code format (basic example: #RRGGBB)
    if (!/^#[0-9A-Fa-f]{6}$/.test(colorHexCode)) {
        setError('HEX-код цвета должен быть в формате #RRGGBB (например, #FF0000).');
        setIsLoading(false);
        return;
    }

    const carData: CarDTO = {
      make,
      model,
      year: Number(year),
      bodyTypeName,
      price: Number(price),
      mileage: mileage === '' ? undefined : Number(mileage),
      engineInfo: engineInfoState, 
      transmissionInfo: transmissionInfoState, 
      colorName, // Name of the color
      colorHexCode, // Hex code for the color
      condition,
      location,
      mainPhotoUrl: mainPhotoUrl || undefined,
      allPhotoUrls: mainPhotoUrl ? [mainPhotoUrl] : [],
      safetyFeatures: [], 
      equipment: [], 
      technicalSpec: {
        fuelType,
        engineVolume: engineVolume === '' ? undefined : Number(engineVolume),
        horsePower: horsePower === '' ? undefined : Number(horsePower),
        driveType,
        transmissionType: transmissionTypeSpec, 
        engineInfo: engineInfoState, // Sync or decide source
        transmissionInfo: transmissionInfoState, // Sync or decide source
        gears: gears === '' ? undefined : Number(gears),
      },
    };

    try {
      // The backend endpoint /api/cars should be able to handle `colorName` and `colorHexCode`
      // to find or create a Color entity.
      const response = await fetch('/api/cars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(carData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        // Log the full error for better debugging if needed
        console.error('Backend error:', errorData);
        throw new Error(errorData.message || 'Не удалось добавить автомобиль. Проверьте консоль для деталей.');
      }

      const newCarResponse = await response.json();
      // Assuming the backend returns the created car DTO within a 'data' field
      onCarAdded(newCarResponse.data);
      
      // Reset form fields
      setMake('');
      setModel('');
      setYear('');
      setBodyTypeName('');
      setPrice('');
      setMileage('');
      setEngineInfoState('');
      setTransmissionInfoState('');
      setColorName('');
      setColorHexCode('');
      setCondition('');
      setLocation('');
      setMainPhotoUrl('');
      setFuelType('');
      setEngineVolume('');
      setHorsePower('');
      setDriveType('');
      setTransmissionTypeSpec('');
      setGears('');
      
      onClose(); // Close modal on success
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при добавлении автомобиля.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050 }}>
      <div className="modal-content bg-white p-4 rounded shadow-lg" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h5 className="mb-3">Добавить новый автомобиль</h5>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          {/* Basic Car Info */}
          <div className="row mb-2">
            <div className="col-md-6">
              <label htmlFor="make" className="form-label">Марка</label>
              <input type="text" className="form-control" id="make" value={make} onChange={(e) => setMake(e.target.value)} required />
            </div>
            <div className="col-md-6">
              <label htmlFor="model" className="form-label">Модель</label>
              <input type="text" className="form-control" id="model" value={model} onChange={(e) => setModel(e.target.value)} required />
            </div>
          </div>
          <div className="row mb-2">
            <div className="col-md-6">
              <label htmlFor="year" className="form-label">Год</label>
              <input type="number" className="form-control" id="year" value={year} onChange={(e) => setYear(e.target.value === '' ? '' : parseInt(e.target.value))} required />
            </div>
            <div className="col-md-6">
              <label htmlFor="bodyTypeName" className="form-label">Тип кузова</label>
              <input type="text" className="form-control" id="bodyTypeName" value={bodyTypeName} onChange={(e) => setBodyTypeName(e.target.value)} required />
            </div>
          </div>
          <div className="row mb-2">
            <div className="col-md-6">
              <label htmlFor="price" className="form-label">Цена</label>
              <input type="number" className="form-control" id="price" value={price} onChange={(e) => setPrice(e.target.value === '' ? '' : parseFloat(e.target.value))} required />
            </div>
            <div className="col-md-6">
              <label htmlFor="mileage" className="form-label">Пробег</label>
              <input type="number" className="form-control" id="mileage" value={mileage} onChange={(e) => setMileage(e.target.value === '' ? '' : parseInt(e.target.value))} />
            </div>
          </div>
          {/* Color Name and Hex Code */}
          <div className="row mb-2">
            <div className="col-md-6">
              <label htmlFor="colorName" className="form-label">Название цвета</label>
              <input type="text" className="form-control" id="colorName" value={colorName} onChange={(e) => setColorName(e.target.value)} required />
            </div>
            <div className="col-md-6">
              <label htmlFor="colorHexCode" className="form-label">HEX-код цвета</label>
              <input type="text" className="form-control" id="colorHexCode" value={colorHexCode} onChange={(e) => setColorHexCode(e.target.value)} placeholder="#RRGGBB" required />
            </div>
          </div>
          <div className="row mb-2">
            <div className="col-md-6">
              <label htmlFor="condition" className="form-label">Состояние</label>
              <input type="text" className="form-control" id="condition" value={condition} onChange={(e) => setCondition(e.target.value)} required />
            </div>
            <div className="col-md-6">
              <label htmlFor="location" className="form-label">Местоположение</label>
              <input type="text" className="form-control" id="location" value={location} onChange={(e) => setLocation(e.target.value)} required />
            </div>
          </div>
          <div className="mb-2">
            <label htmlFor="mainPhotoUrl" className="form-label">URL главного фото</label>
            <input type="text" className="form-control" id="mainPhotoUrl" value={mainPhotoUrl} onChange={(e) => setMainPhotoUrl(e.target.value)} />
          </div>
          
          {/* Technical Specifications */}
          <h6 className="mt-3 mb-2">Технические характеристики</h6>
          <div className="row mb-2">
            <div className="col-md-6">
              <label htmlFor="fuelType" className="form-label">Тип топлива</label>
              <input type="text" className="form-control" id="fuelType" value={fuelType} onChange={(e) => setFuelType(e.target.value)} required />
            </div>
            <div className="col-md-6">
              <label htmlFor="engineVolume" className="form-label">Объем двигателя (л)</label>
              <input type="number" step="0.1" className="form-control" id="engineVolume" value={engineVolume} onChange={(e) => setEngineVolume(e.target.value === '' ? '' : parseFloat(e.target.value))} />
            </div>
          </div>
          <div className="row mb-2">
            <div className="col-md-6">
              <label htmlFor="horsePower" className="form-label">Мощность (л.с.)</label>
              <input type="number" className="form-control" id="horsePower" value={horsePower} onChange={(e) => setHorsePower(e.target.value === '' ? '' : parseInt(e.target.value))} />
            </div>
             <div className="col-md-6">
              <label htmlFor="driveType" className="form-label">Тип привода</label>
              <input type="text" className="form-control" id="driveType" value={driveType} onChange={(e) => setDriveType(e.target.value)} required />
            </div>
          </div>
          <div className="row mb-2">
            <div className="col-md-6">
              <label htmlFor="transmissionTypeSpec" className="form-label">Тип трансмиссии</label>
              <input type="text" className="form-control" id="transmissionTypeSpec" value={transmissionTypeSpec} onChange={(e) => setTransmissionTypeSpec(e.target.value)} required />
            </div>
            <div className="col-md-6">
              <label htmlFor="gears" className="form-label">Кол-во передач</label>
              <input type="number" className="form-control" id="gears" value={gears} onChange={(e) => setGears(e.target.value === '' ? '' : parseInt(e.target.value))} />
            </div>
          </div>

          {/* CarDTO engineInfo & transmissionInfo */}
          <div className="row mb-3">
            <div className="col-md-6">
                <label htmlFor="engineInfoState" className="form-label">Доп. инфо о двигателе (CarDTO)</label>
                <input type="text" className="form-control" id="engineInfoState" value={engineInfoState} onChange={(e) => setEngineInfoState(e.target.value)} />
            </div>
            <div className="col-md-6">
                <label htmlFor="transmissionInfoState" className="form-label">Доп. инфо о трансмиссии (CarDTO)</label>
                <input type="text" className="form-control" id="transmissionInfoState" value={transmissionInfoState} onChange={(e) => setTransmissionInfoState(e.target.value)} />
            </div>
          </div>

          <div className="d-flex justify-content-end">
            <button type="button" className="btn btn-secondary me-2" onClick={onClose} disabled={isLoading}>Отмена</button>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Добавление...' : 'Добавить автомобиль'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCarModal;

