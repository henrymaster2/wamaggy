'use client';

import { useEffect, useState } from 'react';

export interface FoodVariation {
  type: string;
  price: number;
}

export interface FoodItem {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string;
  status: 'Available' | 'Pending' | 'Not Available' | string;
  imageUrl: string;
  variations?: FoodVariation[];
}

export interface FoodWithTheme extends FoodItem {
  themeColor: string; // hex of dominant color
}

export function useFoodThemes() {
  const [foods, setFoods] = useState<FoodWithTheme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAndTheme() {
      try {
        const res = await fetch('/api/food');
        if (!res.ok) throw new Error('Failed to fetch foods');
        const data: FoodItem[] = await res.json();

        const themedFoods: FoodWithTheme[] = await Promise.all(
          data.map(async (food) => {
            const dominant = food.imageUrl ? await getDominantColor(food.imageUrl) : '#f0f0f0';
            return { ...food, themeColor: dominant };
          })
        );

        setFoods(themedFoods);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchAndTheme();
  }, []);

  return { foods, loading };
}

// Dominant color calculation
async function getDominantColor(url: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve('#f0f0f0');
      ctx.drawImage(img, 0, 0);

      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const colorCount: Record<string, number> = {};

      for (let i = 0; i < data.length; i += 4 * 10) { // skip some pixels for speed
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const hex = rgbToHex(r, g, b);
        colorCount[hex] = (colorCount[hex] || 0) + 1;
      }

      const dominant = Object.entries(colorCount).sort((a, b) => b[1] - a[1])[0][0];
      resolve(dominant);
    };
    img.onerror = () => resolve('#f0f0f0');
  });
}

function rgbToHex(r: number, g: number, b: number) {
  return (
    '#' +
    [r, g, b]
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')
  );
}
