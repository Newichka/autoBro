import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Обновленный интерфейс для данных автомобиля, получаемых с auto.ru
export interface RawParsedCar {
  make: string;
  model: string;
  year: number;
  price: number;
  mileage?: number;
  engine?: string;
  horsePower?: number;
  color?: string;
  imageUrl?: string;
  city?: string;
  bodyType?: string;
  transmission?: string;
  drive?: string;
  url?: string;
}

// Обновленная функция для парсинга с использованием backend API
export async function parseCars(url: string): Promise<RawParsedCar[]> {
  console.log(`Парсинг автомобилей с auto.ru через backend: ${url}`);
  
  try {
    // Вызываем backend API для парсинга
    const response = await axios.get('/api/parser/auto-ru', {
      params: { url }
    });
    
    // Проверяем успешность ответа
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      console.log(`Успешно получено ${response.data.data.length} автомобилей с auto.ru`);
      return response.data.data;
    } else {
      console.error('Некорректный формат ответа от API парсера:', response.data);
      return [];
    }
  } catch (error: any) {
    console.error(`Ошибка при парсинге auto.ru через backend: ${error.message}`);
    // Возвращаем пустой массив в случае ошибки
    return [];
  }
}

// Функция для получения детальной информации об автомобиле
export async function parseCarDetails(detailUrl: string): Promise<RawParsedCar | null> {
  console.log(`Парсинг детальной информации об автомобиле: ${detailUrl}`);
  
  try {
    // Вызываем backend API для парсинга деталей
    const response = await axios.get('/api/parser/auto-ru/details', {
      params: { url: detailUrl }
    });
    
    // Проверяем успешность ответа
    if (response.data && response.data.success && response.data.data) {
      console.log(`Успешно получены детали автомобиля: ${response.data.data.make} ${response.data.data.model}`);
      return response.data.data;
    } else {
      console.error('Некорректный формат ответа от API парсера деталей:', response.data);
      return null;
    }
  } catch (error: any) {
    console.error(`Ошибка при парсинге деталей auto.ru через backend: ${error.message}`);
    return null;
  }
}
