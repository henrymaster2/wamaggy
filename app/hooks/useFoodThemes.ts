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
  themeColor: string;
  themePalette: string[];
}

const FALLBACK_THEME_COLOR = '#ea580c';
const FALLBACK_THEME_PALETTE = ['#ea580c', '#facc15', '#fb923c', '#f8fafc', '#22c55e'];

export function useFoodThemes() {
  const [foods, setFoods] = useState<FoodWithTheme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAndTheme() {
      try {
        const res = await fetch('/api/food');
        if (!res.ok) throw new Error('Failed to fetch foods');
        const data: FoodItem[] = await res.json();

        const themedFoods: FoodWithTheme[] = data.map((food) => ({
          ...food,
          themeColor: FALLBACK_THEME_COLOR,
          themePalette: FALLBACK_THEME_PALETTE,
        }));

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
