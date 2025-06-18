import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
  id: number;
  name: string;
  hexCode: string;
}

interface BodyType {
  id: number;
  name: string;
}

interface CarDTO {
  make: string;
  model: string;
  year: number;
  bodyType: { id: number };
  price: number;
  mileage?: number;
  engineInfo?: string;
  transmissionInfo?: string;
  colorName: string;
  colorHexCode: string;
  condition: string;
  location: string;
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
  const [selectedBodyTypeId, setSelectedBodyTypeId] = useState<number | ''>('');
  const [bodyTypes, setBodyTypes] = useState<BodyType[]>([]);
  const [price, setPrice] = useState<number | ''>('');
  const [mileage, setMileage] = useState<number | ''>('');
  const [engineInfoState, setEngineInfoState] = useState(''); // Renamed to avoid conflict with DTO field name
  const [transmissionInfoState, setTransmissionInfoState] = useState(''); // Renamed to avoid conflict
  const [selectedColorId, setSelectedColorId] = useState<number | ''>('');
  const [colors, setColors] = useState<ColorData[]>([]);
  const [condition, setCondition] = useState('');
  const [location, setLocation] = useState('');
  const [mainPhoto, setMainPhoto] = useState<File | null>(null);
  const [additionalPhotos, setAdditionalPhotos] = useState<File[]>([]);
  
  const [fuelType, setFuelType] = useState('');
  const [engineVolume, setEngineVolume] = useState<number | ''>('');
  const [horsePower, setHorsePower] = useState<number | ''>('');
  const [driveType, setDriveType] = useState('');
  const [transmissionTypeSpec, setTransmissionTypeSpec] = useState(''); // Renamed to avoid conflict
  const [gears, setGears] = useState<number | ''>('');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      axios.get('/dictionary/body-types')
        .then(res => {
          setBodyTypes(res.data.data || res.data.content || []);
        })
        .catch((err) => {
          setBodyTypes([]);
          setError('Не удалось загрузить типы кузова');
        });
      axios.get('/dictionary/colors')
        .then(res => {
          setColors(res.data.data || res.data.content || []);
        })
        .catch((err) => {
          setColors([]);
          setError('Не удалось загрузить цвета');
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleMainPhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setMainPhoto(event.target.files[0]);
    }
  };

  const handleAdditionalPhotosChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setAdditionalPhotos(Array.from(event.target.files));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!make || !model || year === '' || selectedBodyTypeId === '' || selectedColorId === '' || price === '' || !condition || !location || !fuelType || !driveType || !transmissionTypeSpec) {
      setError('Пожалуйста, заполните все обязательные поля.');
      setIsLoading(false);
      return;
    }

    const carData = {
      make,
      model,
      year: Number(year),
      bodyTypeId: Number(selectedBodyTypeId),
      colorId: Number(selectedColorId),
      price: Number(price),
      mileage: mileage === '' ? undefined : Number(mileage),
      carCondition: condition,
      location,
      technicalSpec: {
        fuelType,
        engineVolume: engineVolume === '' ? undefined : Number(engineVolume),
        horsePower: horsePower === '' ? undefined : Number(horsePower),
        driveType,
        transmissionType: transmissionTypeSpec,
        engineInfo: engineInfoState,
        transmissionInfo: transmissionInfoState,
        gears: gears === '' ? undefined : Number(gears),
      },
    };

    const formData = new FormData();
    formData.append('car', JSON.stringify(carData));
    
    if (mainPhoto) {
      formData.append('mainPhoto', mainPhoto);
    }
    
    additionalPhotos.forEach((photo) => {
      formData.append('additionalPhotos', photo);
    });

    try {
      const response = await axios.post('/cars', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200) {
        onCarAdded(response.data);
        onClose();
      }
    } catch (error: any) {
      if (error.response && error.response.data) {
        setError('Ошибка: ' + (typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data)));
      } else {
        setError('Произошла ошибка при добавлении автомобиля');
      }
      console.error('Error adding car:', error);
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
              <label htmlFor="bodyType" className="form-label">Тип кузова</label>
              <select className="form-select" id="bodyType" value={selectedBodyTypeId} onChange={e => setSelectedBodyTypeId(Number(e.target.value))} required>
                <option value="">Выберите тип кузова</option>
                {bodyTypes.map(bt => (
                  <option key={bt.id} value={bt.id}>{bt.name}</option>
                ))}
              </select>
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
              <label htmlFor="color" className="form-label">Цвет</label>
              <select className="form-select" id="color" value={selectedColorId} onChange={e => setSelectedColorId(Number(e.target.value))} required>
                <option value="">Выберите цвет</option>
                {colors.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.hexCode})</option>
                ))}
              </select>
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

          <div className="mb-3">
            <label htmlFor="mainPhoto" className="form-label">Главное фото</label>
            <input
              type="file"
              className="form-control"
              id="mainPhoto"
              accept="image/*"
              onChange={handleMainPhotoChange}
              required
            />
          </div>
          
          <div className="mb-3">
            <label htmlFor="additionalPhotos" className="form-label">Дополнительные фото</label>
            <input
              type="file"
              className="form-control"
              id="additionalPhotos"
              accept="image/*"
              multiple
              onChange={handleAdditionalPhotosChange}
            />
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

