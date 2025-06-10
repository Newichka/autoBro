-- Удаление существующих таблиц в обратном порядке зависимостей
DROP TABLE IF EXISTS car_equipment CASCADE;
DROP TABLE IF EXISTS car_safety_features CASCADE;
DROP TABLE IF EXISTS car_tech_specs CASCADE;
DROP TABLE IF EXISTS car_photos CASCADE;
DROP TABLE IF EXISTS cars CASCADE;
DROP TABLE IF EXISTS colors CASCADE;
DROP TABLE IF EXISTS body_types CASCADE;
DROP TABLE IF EXISTS safety_features CASCADE;
DROP TABLE IF EXISTS equipment CASCADE;

-- Создание таблиц c нужной структурой
CREATE TABLE IF NOT EXISTS body_types (
                                          id SERIAL PRIMARY KEY,
                                          name VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS colors (
                                      id SERIAL PRIMARY KEY,
                                      name VARCHAR(50) NOT NULL,
                                      hex_code VARCHAR(7) NOT NULL
);

CREATE TABLE IF NOT EXISTS safety_features (
                                               id SERIAL PRIMARY KEY,
                                               name VARCHAR(100) NOT NULL,
                                               description TEXT,
                                               feature_type VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS equipment (
                                         id SERIAL PRIMARY KEY,
                                         name VARCHAR(100) NOT NULL,
                                         description TEXT,
                                         category VARCHAR(50) NOT NULL,
                                         is_standard BOOLEAN DEFAULT FALSE
);

-- Изменена структура таблицы cars без поля condition
CREATE TABLE IF NOT EXISTS cars (
                                    id SERIAL PRIMARY KEY,
                                    make VARCHAR(100) NOT NULL,
                                    model VARCHAR(100) NOT NULL,
                                    year INT NOT NULL,
                                    body_type_id INT REFERENCES body_types(id),
                                    price DECIMAL(10, 2) NOT NULL,
                                    mileage INT NOT NULL,
                                    color_id INT REFERENCES colors(id),
                                    car_condition VARCHAR(50), -- Переименовано поле condition в car_condition
                                    location VARCHAR(255),
                                    main_photo_url VARCHAR(1000),
                                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS car_photos (
                                          id SERIAL PRIMARY KEY,
                                          car_id INT REFERENCES cars(id) ON DELETE CASCADE,
                                          url VARCHAR(1000) NOT NULL,
                                          main_photo BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS car_tech_specs (
                                              id SERIAL PRIMARY KEY,
                                              car_id INT REFERENCES cars(id) ON DELETE CASCADE,
                                              fuel_type VARCHAR(50),
                                              engine_volume DECIMAL(3, 1),
                                              horse_power INT,
                                              drive_type VARCHAR(50),
                                              transmission_type VARCHAR(50),
                                              engine_info VARCHAR(100),
                                              transmission_info VARCHAR(100),
                                              gears INT,
                                              CONSTRAINT uq_car_tech_specs_car_id UNIQUE (car_id)
);

CREATE TABLE IF NOT EXISTS car_safety_features (
                                                   id SERIAL PRIMARY KEY,
                                                   car_id INT REFERENCES cars(id),
                                                   feature_id INT REFERENCES safety_features(id),
                                                   UNIQUE(car_id, feature_id)
);

CREATE TABLE IF NOT EXISTS car_equipment (
                                             id SERIAL PRIMARY KEY,
                                             car_id INT REFERENCES cars(id),
                                             equipment_id INT REFERENCES equipment(id),
                                             UNIQUE(car_id, equipment_id)
);

-- Заполнение справочников на русском языке
INSERT INTO body_types (name) VALUES
                                  ('Седан'), ('Хэтчбек'), ('Универсал'), ('Внедорожник'), ('Кроссовер'), ('Купе'), ('Кабриолет'), ('Минивэн');

INSERT INTO colors (name, hex_code) VALUES
                                        ('Белый', '#FFFFFF'),
                                        ('Черный', '#000000'),
                                        ('Серебристый', '#C0C0C0'),
                                        ('Красный', '#FF0000'),
                                        ('Синий', '#0000FF'),
                                        ('Зеленый', '#008000');

INSERT INTO safety_features (id, name, description, feature_type) VALUES
                                                                      (1, 'ABS', 'Антиблокировочная система тормозов', 'ACTIVE'),
                                                                      (2, 'ESP', 'Электронная система стабилизации', 'ACTIVE'),
                                                                      (3, 'Подушки безопасности', 'Фронтальные и боковые подушки безопасности', 'PASSIVE'),
                                                                      (4, 'Система контроля слепых зон', 'Мониторинг слепых зон', 'ACTIVE'),
                                                                      (5, 'Система ночного видения', 'Инфракрасная камера для ночного видения', 'ACTIVE'),
                                                                      (6, 'Система удержания в полосе', 'Помощь в удержании автомобиля в полосе движения', 'ACTIVE');

INSERT INTO equipment (id, name, description, category, is_standard) VALUES
                                                                         (1, 'Климат-контроль', 'Автоматическая система климат-контроля', 'COMFORT', true),
                                                                         (2, 'Кожаный салон', 'Отделка салона натуральной кожей', 'INTERIOR', false),
                                                                         (3, 'Подогрев сидений', 'Подогрев передних сидений', 'COMFORT', true),
                                                                         (4, 'Электрорегулировка сидений', 'Электрическая регулировка положения сидений', 'COMFORT', false),
                                                                         (5, 'Бесключевой доступ', 'Система доступа в автомобиль без ключа', 'COMFORT', false),
                                                                         (6, 'Мультимедийная система', 'Мультимедийная система с сенсорным экраном', 'MULTIMEDIA', true),
                                                                         (7, 'Навигация', 'Встроенная навигационная система', 'MULTIMEDIA', false),
                                                                         (8, 'Камера заднего вида', 'Камера для помощи при парковке задним ходом', 'SAFETY', true),
                                                                         (9, '4-зонный климат-контроль', 'Климат-контроль с индивидуальными настройками для 4 зон', 'COMFORT', false),
                                                                         (10, 'Вентиляция сидений', 'Вентиляция передних сидений', 'COMFORT', false),
                                                                         (11, 'Панорамная крыша', 'Панорамная стеклянная крыша с люком', 'INTERIOR', false),
                                                                         (12, 'Проекционный дисплей', 'Проекция информации на лобовое стекло', 'MULTIMEDIA', false),
                                                                         (13, 'Аудиосистема премиум-класса', 'Аудиосистема Harman/Kardon', 'MULTIMEDIA', false),
                                                                         (14, 'Адаптивные фары', 'Адаптивные светодиодные фары', 'EXTERIOR', false),
                                                                         (15, 'Беспроводная зарядка', 'Беспроводная зарядка для смартфонов', 'MULTIMEDIA', false),
                                                                         (16, 'MBUX', 'Мультимедийная система Mercedes-Benz User Experience', 'MULTIMEDIA', false),
                                                                         (17, 'Адаптивная подвеска', 'Адаптивная пневматическая подвеска AIRMATIC', 'COMFORT', false),
                                                                         (18, 'Адаптивные светодиодные фары', 'Интеллектуальная система освещения', 'EXTERIOR', false),
                                                                         (19, 'Память настроек', 'Память настроек сидений и зеркал', 'COMFORT', false),
                                                                         (21, 'Подогрев руля', 'Подогрев рулевого колеса', 'COMFORT', false),
                                                                         (22, 'Электропривод багажника', 'Электропривод двери багажника', 'COMFORT', false);

-- Заполнение данных о автомобилях
-- Автомобиль 1: Toyota Camry
INSERT INTO cars (make, model, year, body_type_id, price, mileage, color_id, car_condition, location, main_photo_url)
VALUES ('Toyota', 'Camry', 2023, 1, 2500000, 5600, 2, 'Отличное', 'Москва, Россия', 'https://placehold.co/600x400/black/white?text=Toyota+Camry+2023');

INSERT INTO car_tech_specs (car_id, fuel_type, engine_volume, horse_power, drive_type, transmission_type, engine_info, transmission_info, gears)
VALUES (1, 'Бензин', 2.5, 200, 'Передний', 'Автоматическая', 'Бензиновый 2.5L Dynamic Force', 'Автоматическая 8-ступенчатая', 8);

INSERT INTO car_safety_features (car_id, feature_id) VALUES
                                                           (1, 1), (1, 2), (1, 3), (1, 4),
                                                           (1, 5), (1, 6);

INSERT INTO car_equipment (car_id, equipment_id) VALUES
                                                       (1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8);

-- Автомобиль 2: BMW 5 Series
INSERT INTO cars (make, model, year, body_type_id, price, mileage, color_id, car_condition, location, main_photo_url)
VALUES ('BMW', '5 Series', 2022, 1, 4800000, 15000, 1, 'Отличное', 'Санкт-Петербург, Россия', 'https://placehold.co/600x400/222222/white?text=BMW+5+Series+2022');

INSERT INTO car_tech_specs (car_id, fuel_type, engine_volume, horse_power, drive_type, transmission_type, engine_info, transmission_info, gears)
VALUES (2, 'Дизель', 3.0, 249, 'Полный', 'Автоматическая', 'Дизель 3.0L TwinPower Turbo', 'Автоматическая 8-ст. Steptronic', 8);

INSERT INTO car_safety_features (car_id, feature_id) VALUES
                                                           (2, 1), (2, 2), (2, 3), (2, 4),
                                                           (2, 5), (2, 6);

INSERT INTO car_equipment (car_id, equipment_id) VALUES
                                                       (2, 9), (2, 10), (2, 11), (2, 12), (2, 13), (2, 14), (2, 15);

-- Автомобиль 3: Mercedes-Benz GLC
INSERT INTO cars (make, model, year, body_type_id, price, mileage, color_id, car_condition, location, main_photo_url)
VALUES ('Mercedes-Benz', 'GLC', 2023, 5, 5300000, 3200, 4, 'Новое', 'Краснодар, Россия', 'https://placehold.co/600x400/cc0000/white?text=Mercedes+GLC+2023');

INSERT INTO car_tech_specs (car_id, fuel_type, engine_volume, horse_power, drive_type, transmission_type, engine_info, transmission_info, gears)
VALUES (3, 'Бензин', 2.0, 258, 'Полный', 'Автоматическая', 'Бензин 2.0L с турбонаддувом', 'Автоматическая 9G-TRONIC', 9);

INSERT INTO car_safety_features (car_id, feature_id) VALUES
                                                           (3, 1), (3, 2), (3, 3), (3, 4),
                                                           (3, 5), (3, 6);

INSERT INTO car_equipment (car_id, equipment_id) VALUES
                                                       (3, 16), (3, 17), (3, 18), (3, 19), (3, 21), (3, 22);

-- Автомобиль 4: Audi A6
INSERT INTO cars (make, model, year, body_type_id, price, mileage, color_id, car_condition, location, main_photo_url)
VALUES ('Audi', 'A6', 2021, 1, 4200000, 25000, 3, 'Хорошее', 'Екатеринбург, Россия', 'https://placehold.co/600x400/cccccc/333333?text=Audi+A6+2021');

INSERT INTO car_tech_specs (car_id, fuel_type, engine_volume, horse_power, drive_type, transmission_type, engine_info, transmission_info, gears)
VALUES (4, 'Бензин', 2.0, 245, 'Полный', 'Автоматическая', 'Бензин 2.0L TFSI quattro', 'Автоматическая S tronic 7-ст.', 7);

INSERT INTO car_safety_features (car_id, feature_id) VALUES
                                                           (4, 1), (4, 2), (4, 3), (4, 4);

INSERT INTO car_equipment (car_id, equipment_id) VALUES
                                                       (4, 1), (4, 2), (4, 5), (4, 6), (4, 8), (4, 9), (4, 12);

-- Автомобиль 5: Volkswagen Tiguan
INSERT INTO cars (make, model, year, body_type_id, price, mileage, color_id, car_condition, location, main_photo_url)
VALUES ('Volkswagen', 'Tiguan', 2020, 5, 2850000, 42000, 1, 'Хорошее', 'Нижний Новгород, Россия', 'https://placehold.co/600x400/eeeeee/333333?text=VW+Tiguan+2020');

INSERT INTO car_tech_specs (car_id, fuel_type, engine_volume, horse_power, drive_type, transmission_type, engine_info, transmission_info, gears)
VALUES (5, 'Бензин', 2.0, 180, 'Полный', 'Автоматическая', 'Бензин 2.0L TSI 4Motion', 'Автоматическая DSG 7-ст.', 7);

INSERT INTO car_safety_features (car_id, feature_id) VALUES
                                                           (5, 1), (5, 2), (5, 3);

INSERT INTO car_equipment (car_id, equipment_id) VALUES
                                                       (5, 1), (5, 3), (5, 6), (5, 8), (5, 21);

-- Автомобиль 6: Kia K5
INSERT INTO cars (make, model, year, body_type_id, price, mileage, color_id, car_condition, location, main_photo_url)
VALUES ('Kia', 'K5', 2022, 1, 2350000, 18500, 5, 'Отличное', 'Казань, Россия', 'https://placehold.co/600x400/0000cc/white?text=Kia+K5+2022');

INSERT INTO car_tech_specs (car_id, fuel_type, engine_volume, horse_power, drive_type, transmission_type, engine_info, transmission_info, gears)
VALUES (6, 'Бензин', 2.0, 150, 'Передний', 'Автоматическая', 'Бензин 2.0L MPI Smartstream', 'Автоматическая 6-ступенчатая', 6);

INSERT INTO car_safety_features (car_id, feature_id) VALUES
                                                           (6, 1), (6, 2), (6, 3);

INSERT INTO car_equipment (car_id, equipment_id) VALUES
                                                       (6, 1), (6, 3), (6, 6), (6, 8);

-- Вставка данных в таблицу car_photos (фотографии автомобилей)
INSERT INTO car_photos (id, car_id, url, main_photo) VALUES
-- Toyota Camry photos
(1, 1, 'https://placehold.co/600x400/black/white?text=Toyota+Camry+2023+Вид+спереди', true),
(2, 1, 'https://placehold.co/600x400/black/white?text=Toyota+Camry+2023+Вид+сбоку', false),
(3, 1, 'https://placehold.co/600x400/black/white?text=Toyota+Camry+2023+Вид+сзади', false),
-- BMW 5 Series photos
(4, 2, 'https://placehold.co/600x400/222222/white?text=BMW+5+Series+2022+Вид+спереди', true),
(5, 2, 'https://placehold.co/600x400/222222/white?text=BMW+5+Series+2022+Вид+сбоку', false),
(6, 2, 'https://placehold.co/600x400/222222/white?text=BMW+5+Series+2022+Вид+сзади', false),
-- Mercedes-Benz GLC photos
(7, 3, 'https://placehold.co/600x400/cc0000/white?text=Mercedes+GLC+2023+Вид+спереди', true),
(8, 3, 'https://placehold.co/600x400/cc0000/white?text=Mercedes+GLC+2023+Вид+сбоку', false),
(9, 3, 'https://placehold.co/600x400/cc0000/white?text=Mercedes+GLC+2023+Вид+сзади', false),
-- Audi A6 photos
(10, 4, 'https://placehold.co/600x400/cccccc/333333?text=Audi+A6+2021+Вид+спереди', true),
(11, 4, 'https://placehold.co/600x400/cccccc/333333?text=Audi+A6+2021+Вид+сбоку', false),
(12, 4, 'https://placehold.co/600x400/cccccc/333333?text=Audi+A6+2021+Вид+сзади', false),
-- Volkswagen Tiguan photos
(13, 5, 'https://placehold.co/600x400/eeeeee/333333?text=VW+Tiguan+2020+Вид+спереди', true),
(14, 5, 'https://placehold.co/600x400/eeeeee/333333?text=VW+Tiguan+2020+Вид+сбоку', false),
(15, 5, 'https://placehold.co/600x400/eeeeee/333333?text=VW+Tiguan+2020+Вид+сзади', false),
-- Kia K5 photos
(16, 6, 'https://placehold.co/600x400/0000cc/white?text=Kia+K5+2022+Вид+спереди', true),
(17, 6, 'https://placehold.co/600x400/0000cc/white?text=Kia+K5+2022+Вид+сбоку', false),
(18, 6, 'https://placehold.co/600x400/0000cc/white?text=Kia+K5+2022+Вид+сзади', false);

