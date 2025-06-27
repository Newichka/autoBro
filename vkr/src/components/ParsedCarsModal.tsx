import React from 'react';
import { ParsedCar } from '../services/carParserService';

interface ParsedCarsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cars: ParsedCar[];
  onSelectCar: (car: ParsedCar) => void;
  loading: boolean;
}

const ParsedCarsModal: React.FC<ParsedCarsModalProps> = ({
  isOpen,
  onClose,
  cars,
  onSelectCar,
  loading
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Найденные автомобили на аукционах</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {loading ? (
              <div className="text-center p-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Загрузка...</span>
                </div>
              </div>
            ) : cars.length === 0 ? (
              <div className="alert alert-info">
                По вашему запросу ничего не найдено
              </div>
            ) : (
              <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
                {cars.map((car) => (
                  <div key={car.id} className="col">
                    <div className="card h-100">
                      <div className="position-relative">
                        <img
                          src={car.imageUrl}
                          className="card-img-top"
                          alt={car.title}
                          style={{ height: '200px', objectFit: 'cover' }}
                        />
                        <span className="position-absolute top-0 end-0 badge bg-primary m-2">
                          {car.source}
                        </span>
                      </div>
                      <div className="card-body">
                        <h5 className="card-title">{car.title}</h5>
                        <p className="card-text">
                          <strong>Цена:</strong> {car.price.toLocaleString()} $<br />
                          <strong>Год:</strong> {car.year}<br />
                          <strong>Цвет:</strong> {car.color}<br />
                          <strong>Состояние:</strong> {car.condition}<br />
                          {car.location && (
                            <>
                              <strong>Локация:</strong> {car.location}<br />
                            </>
                          )}
                          {car.auctionDate && (
                            <>
                              <strong>Дата аукциона:</strong> {car.auctionDate}
                            </>
                          )}
                        </p>
                        <div className="d-flex justify-content-between">
                          <a
                            href={car.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline-primary btn-sm"
                          >
                            Открыть на аукционе
                          </a>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => onSelectCar(car)}
                          >
                            Выбрать
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParsedCarsModal; 