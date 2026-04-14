// src/components/ASIS_8_Dietetica/MealPlanViewer.tsx
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Utensils, TrendingUp, Clock, Zap, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

interface MealPlanViewerProps {
  patientId: string;
  mealPlan?: {
    plan_id: string;
    plan_type: string;
    caloric_goal: number;
    protein_target: number;
    carbs_target: number;
    fats_target: number;
    start_date: string;
    end_date: string;
    adherence_goal: number;
  };
}

interface MealEntry {
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  time: string;
  items: string[];
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export const MealPlanViewer: React.FC<MealPlanViewerProps> = ({ patientId, mealPlan }) => {
  const [selectedDay, setSelectedDay] = useState<'today' | 'week'>('today');
  const [expandedMeal, setExpandedMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack' | null>('breakfast');

  // Mock data - replace with API
  const todaysMeals: MealEntry[] = [
    {
      meal_type: 'breakfast',
      time: '07:00 AM',
      items: ['Oatmeal with berries', 'Greek yogurt', 'Honey', 'Green tea'],
      calories: 420,
      protein: 15,
      carbs: 55,
      fats: 8
    },
    {
      meal_type: 'lunch',
      time: '12:30 PM',
      items: ['Grilled chicken breast', 'Brown rice', 'Steamed broccoli', 'Olive oil dressing'],
      calories: 580,
      protein: 42,
      carbs: 65,
      fats: 12
    },
    {
      meal_type: 'dinner',
      time: '07:00 PM',
      items: ['Baked salmon', 'Sweet potato', 'Green salad', 'Lemon juice'],
      calories: 520,
      protein: 38,
      carbs: 48,
      fats: 15
    },
    {
      meal_type: 'snack',
      time: '04:00 PM',
      items: ['Apple', 'Almonds (1 oz)', 'Water'],
      calories: 220,
      protein: 6,
      carbs: 28,
      fats: 8
    }
  ];

  const dailyTotals = {
    calories: todaysMeals.reduce((sum, meal) => sum + meal.calories, 0),
    protein: todaysMeals.reduce((sum, meal) => sum + meal.protein, 0),
    carbs: todaysMeals.reduce((sum, meal) => sum + meal.carbs, 0),
    fats: todaysMeals.reduce((sum, meal) => sum + meal.fats, 0)
  };

  const macroData = [
    { name: 'Protein', value: dailyTotals.protein, target: mealPlan?.protein_target || 100, unit: 'g' },
    { name: 'Carbs', value: dailyTotals.carbs, target: mealPlan?.carbs_target || 300, unit: 'g' },
    { name: 'Fats', value: dailyTotals.fats, target: mealPlan?.fats_target || 70, unit: 'g' }
  ];

  const pieData = [
    { name: 'Protein', value: (dailyTotals.protein * 4 / dailyTotals.calories * 100).toFixed(1) },
    { name: 'Carbs', value: (dailyTotals.carbs * 4 / dailyTotals.calories * 100).toFixed(1) },
    { name: 'Fats', value: (dailyTotals.fats * 9 / dailyTotals.calories * 100).toFixed(1) }
  ];

  const mealIcons: { [key: string]: string } = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌙',
    snack: '🍎'
  };

  const getMacroColor = (actual: number, target: number) => {
    const percentage = (actual / target) * 100;
    if (percentage >= 90 && percentage <= 110) return 'text-green-600';
    if (percentage > 110) return 'text-orange-600';
    return 'text-blue-600';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-4xl">
      <div className="flex items-center gap-2 mb-6">
        <Utensils className="w-5 h-5 text-blue-500" />
        <h2 className="text-xl font-bold">Meal Plan Viewer</h2>
      </div>

      {/* Plan Type Badge */}
      {mealPlan && (
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Plan: </span>
            {mealPlan.plan_type.replace(/_/g, ' ').toUpperCase()}{' '}
            <span className="text-gray-500 text-xs ml-2">
              {mealPlan.adherence_goal}% goal adherence
            </span>
          </p>
        </div>
      )}

      {/* Tab Selection */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setSelectedDay('today')}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            selectedDay === 'today'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setSelectedDay('week')}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            selectedDay === 'week'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Weekly Summary
        </button>
      </div>

      {selectedDay === 'today' && (
        <div className="space-y-6">
          {/* Daily Totals Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-orange-600" />
                <p className="text-sm text-gray-600">Calories</p>
              </div>
              <p className="text-2xl font-bold text-orange-600">{dailyTotals.calories}</p>
              <p className="text-xs text-gray-600 mt-1">
                Goal: {mealPlan?.caloric_goal || 2000}
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-red-600" />
                <p className="text-sm text-gray-600">Protein</p>
              </div>
              <p className={`text-2xl font-bold ${getMacroColor(dailyTotals.protein, mealPlan?.protein_target || 100)}`}>
                {dailyTotals.protein}g
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Goal: {mealPlan?.protein_target || 100}g
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-green-600" />
                <p className="text-sm text-gray-600">Carbs</p>
              </div>
              <p className={`text-2xl font-bold ${getMacroColor(dailyTotals.carbs, mealPlan?.carbs_target || 300)}`}>
                {dailyTotals.carbs}g
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Goal: {mealPlan?.carbs_target || 300}g
              </p>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <Utensils className="w-4 h-4 text-yellow-600" />
                <p className="text-sm text-gray-600">Fats</p>
              </div>
              <p className={`text-2xl font-bold ${getMacroColor(dailyTotals.fats, mealPlan?.fats_target || 70)}`}>
                {dailyTotals.fats}g
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Goal: {mealPlan?.fats_target || 70}g
              </p>
            </div>
          </div>

          {/* Macronutrient Charts */}
          <div className="grid grid-cols-2 gap-6">
            {/* Bar Chart - Macros vs Target */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Macronutrient Breakdown</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={macroData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#3b82f6" name="Actual (g)" />
                  <Bar dataKey="target" fill="#10b981" name="Target (g)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart - Calorie Distribution */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Calorie Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Protein', value: parseFloat(pieData[0].value) },
                      { name: 'Carbs', value: parseFloat(pieData[1].value) },
                      { name: 'Fats', value: parseFloat(pieData[2].value) }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name} ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {COLORS.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Meals by Type */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Today's Meals</h3>
            {todaysMeals.map((meal) => (
              <div key={meal.meal_type} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedMeal(expandedMeal === meal.meal_type ? null : meal.meal_type)}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{mealIcons[meal.meal_type]}</span>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 capitalize">{meal.meal_type}</p>
                      <p className="text-xs text-gray-500">{meal.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-700 font-medium">{meal.calories} cal</span>
                    {expandedMeal === meal.meal_type ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {expandedMeal === meal.meal_type && (
                  <div className="px-4 py-3 bg-white border-t border-gray-200">
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Items:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {meal.items.map((item, idx) => (
                          <li key={idx} className="text-sm text-gray-600">{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="grid grid-cols-4 gap-2 pt-3 border-t border-gray-200">
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Protein</p>
                        <p className="text-sm font-semibold text-gray-900">{meal.protein}g</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Carbs</p>
                        <p className="text-sm font-semibold text-gray-900">{meal.carbs}g</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Fats</p>
                        <p className="text-sm font-semibold text-gray-900">{meal.fats}g</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500">Calories</p>
                        <p className="text-sm font-semibold text-gray-900">{meal.calories}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedDay === 'week' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-center text-gray-600">
            Weekly meal data aggregation coming soon - shows adherence trends, average macros by day, and week-over-week progress
          </p>
        </div>
      )}
    </div>
  );
};
