import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TaxBracketVisualization = () => {
  // Toggle state for showing extended income levels
  const [showExtendedRange, setShowExtendedRange] = useState(false);

  // Tax bracket data with corrected NJ highest bracket
  const taxData = {
    NJ: [
      { rate: 1.40, min: 0, max: 20000 },
      { rate: 1.75, min: 20001, max: 35000 },
      { rate: 3.50, min: 35001, max: 40000 },
      { rate: 5.53, min: 40001, max: 75000 },
      { rate: 6.37, min: 75001, max: 500000 },
      { rate: 8.97, min: 500001, max: 1000000 },
      { rate: 10.75, min: 1000001, max: 999999999 }
    ],
    NY: [
      { rate: 4.00, min: 0, max: 8500 },
      { rate: 4.50, min: 8501, max: 11700 },
      { rate: 5.25, min: 11701, max: 13900 },
      { rate: 5.50, min: 13901, max: 80650 },
      { rate: 6.00, min: 80651, max: 215400 },
      { rate: 6.85, min: 215401, max: 1077550 },
      { rate: 9.65, min: 1077551, max: 5000000 },
      { rate: 10.30, min: 5000001, max: 25000000 },
      { rate: 10.90, min: 25000001, max: 999999999 }
    ],
    CT: [
      { rate: 2.00, min: 0, max: 10000 },
      { rate: 4.50, min: 10001, max: 50000 },
      { rate: 5.50, min: 50001, max: 100000 },
      { rate: 6.00, min: 100001, max: 200000 },
      { rate: 6.50, min: 200001, max: 250000 },
      { rate: 6.90, min: 250001, max: 500000 },
      { rate: 6.99, min: 500001, max: 999999999 }
    ],
    NYC: [
      { rate: 3.08, min: 0, max: 12000 },
      { rate: 3.76, min: 12001, max: 25000 },
      { rate: 3.82, min: 25001, max: 50000 },
      { rate: 3.88, min: 50001, max: 999999999 }
    ]
  };

  // Income levels for tables
  const bracketIncomeLevel = [0, 10000, 25000, 50000, 75000, 100000, 150000, 200000, 300000, 500000, 750000, 1000000, 1500000, 2000000, 5000000, 10000000, 25000000];
  const standardIncomeLevel = [100000, 200000, 300000, 500000, 750000, 1000000];
  const extendedIncomeLevel = [100000, 200000, 300000, 500000, 750000, 1000000, 1500000, 2000000, 3000000, 5000000, 10000000, 25000000];
  
  // Use appropriate income level array based on toggle
  const effectiveIncomeLevel = showExtendedRange ? extendedIncomeLevel : standardIncomeLevel;

  // Format income display
  const formatIncome = (income) => {
    if (income === 0) return '$0';
    if (income >= 1000000) {
      const millions = income / 1000000;
      return millions % 1 === 0 ? `$${millions}M` : `$${millions.toFixed(1)}M`;
    }
    return `$${(income / 1000).toFixed(0)}K`;
  };

  // Format dollar amounts for chart
  const formatChartAmount = (value) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    } else {
      return `$${value}`;
    }
  };

  // Get tax rate at specific income level
  const getTaxRateAtIncome = (income, state) => {
    const brackets = taxData[state];
    const adjustedIncome = state === 'NY' ? Math.max(0, income - 8000) : income;
    
    for (const bracket of brackets) {
      if (adjustedIncome >= bracket.min && adjustedIncome <= bracket.max) {
        return bracket.rate;
      }
    }
    return brackets[brackets.length - 1].rate;
  };

  // Create merged segments for marginal tax visualization
  const getMergedSegments = (state) => {
    const segments = [];
    let currentSegment = null;
    
    bracketIncomeLevel.forEach((income, index) => {
      const rate = getTaxRateAtIncome(income, state);
      
      if (!currentSegment || currentSegment.rate !== rate) {
        if (currentSegment) {
          segments.push(currentSegment);
        }
        currentSegment = {
          rate: rate,
          startIndex: index,
          endIndex: index,
          colspan: 1
        };
      } else {
        currentSegment.endIndex = index;
        currentSegment.colspan += 1;
      }
    });
    
    if (currentSegment) {
      segments.push(currentSegment);
    }
    
    return segments;
  };

  // Get color intensity for visualization
  const getColorIntensity = (rate, state) => {
    const maxRate = Math.max(...taxData[state].map(b => b.rate));
    const intensity = rate / maxRate;
    const baseColors = {
      NJ: { r: 244, g: 67, b: 54 },
      NY: { r: 33, g: 150, b: 243 },
      CT: { r: 76, g: 175, b: 80 },
      NYC: { r: 255, g: 152, b: 0 }
    };
    const base = baseColors[state];
    const alpha = 0.2 + (intensity * 0.6);
    return `rgba(${base.r}, ${base.g}, ${base.b}, ${alpha})`;
  };

  // Calculate effective tax rate - FIXED LOGIC
  const calculateEffectiveTax = (income, state) => {
    const brackets = taxData[state];
    
    // Apply NY personal exemption
    let taxableIncome = income;
    if (state === 'NY') {
      taxableIncome = Math.max(0, income - 8000);
    }
    
    if (taxableIncome <= 0) return 0;
    
    let tax = 0;
    let previousThreshold = 0;
    
    for (const bracket of brackets) {
      if (taxableIncome > previousThreshold) {
        // Calculate income that falls in this bracket
        const incomeInBracket = Math.min(taxableIncome - previousThreshold, bracket.max - previousThreshold);
        
        if (incomeInBracket > 0) {
          tax += (incomeInBracket * bracket.rate) / 100;
        }
      }
      
      previousThreshold = bracket.max;
      
      if (taxableIncome <= bracket.max) break;
    }
    
    return (tax / income) * 100;
  };

  // Format tax amount consistently
  const formatTaxAmount = (taxAmount) => {
    if (taxAmount >= 1000000) {
      // Format in millions with 1 decimal, round to nearest $100K for precision
      const roundedAmount = Math.round(taxAmount / 100000) * 100000;
      return `$${(roundedAmount / 1000000).toFixed(1)}M`;
    } else {
      // Format in thousands, round to nearest $1K
      const roundedAmount = Math.round(taxAmount / 1000) * 1000;
      return `$${(roundedAmount / 1000).toFixed(0)}K`;
    }
  };

  // Calculate effective tax amount in dollars
  const calculateEffectiveTaxAmount = (income, state) => {
    const effectiveRate = calculateEffectiveTax(income, state);
    const taxAmount = (income * effectiveRate) / 100;
    return formatTaxAmount(taxAmount);
  };

  // Create chart data for line chart - using dollar amounts
  const createChartData = () => {
    return effectiveIncomeLevel.map(income => {
      const ctRate = calculateEffectiveTax(income, 'CT');
      const njRate = calculateEffectiveTax(income, 'NJ');
      const nyRate = calculateEffectiveTax(income, 'NY');
      const nycRate = calculateEffectiveTax(income, 'NYC');
      const nycTotal = nyRate + nycRate;
      
      // Calculate actual dollar amounts
      const ctAmount = (income * ctRate) / 100;
      const njAmount = (income * njRate) / 100;
      const nyAmount = (income * nyRate) / 100;
      const nycTotalAmount = (income * nycTotal) / 100;
      
      return {
        income: income,
        incomeLabel: formatIncome(income),
        CT: Math.round(ctAmount),
        NJ: Math.round(njAmount),
        'NY State': Math.round(nyAmount),
        'NYC Total': Math.round(nycTotalAmount)
      };
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto bg-white">
      <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
        Tax Bracket Comparison: CT, NY, NJ
      </h1>
      
      {/* Marginal Tax Rate Table */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-700">
          Marginal Tax Rates by Income Level
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left font-semibold">State/City</th>
                {bracketIncomeLevel.map(income => (
                  <th key={income} className="border border-gray-300 px-2 py-2 text-center font-semibold min-w-16 text-sm">
                    {formatIncome(income)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2 font-semibold text-green-700">CT</td>
                {getMergedSegments('CT').map((segment, segIndex) => (
                  <td 
                    key={segIndex}
                    colSpan={segment.colspan}
                    className="border-l border-t border-b border-gray-300 px-2 py-2 text-center font-semibold text-sm"
                    style={{ 
                      backgroundColor: getColorIntensity(segment.rate, 'CT'),
                      borderRight: segIndex === getMergedSegments('CT').length - 1 ? '1px solid rgb(209, 213, 219)' : 'none'
                    }}
                  >
                    {segment.rate.toFixed(2)}%
                  </td>
                ))}
              </tr>

              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2 font-semibold text-red-700">NJ</td>
                {getMergedSegments('NJ').map((segment, segIndex) => (
                  <td 
                    key={segIndex}
                    colSpan={segment.colspan}
                    className="border-l border-t border-b border-gray-300 px-2 py-2 text-center font-semibold text-sm"
                    style={{ 
                      backgroundColor: getColorIntensity(segment.rate, 'NJ'),
                      borderRight: segIndex === getMergedSegments('NJ').length - 1 ? '1px solid rgb(209, 213, 219)' : 'none'
                    }}
                  >
                    {segment.rate.toFixed(2)}%
                  </td>
                ))}
              </tr>
              
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2 font-semibold text-blue-700">NY State</td>
                {getMergedSegments('NY').map((segment, segIndex) => (
                  <td 
                    key={segIndex}
                    colSpan={segment.colspan}
                    className="border-l border-t border-b border-gray-300 px-2 py-2 text-center font-semibold text-sm"
                    style={{ 
                      backgroundColor: getColorIntensity(segment.rate, 'NY'),
                      borderRight: segIndex === getMergedSegments('NY').length - 1 ? '1px solid rgb(209, 213, 219)' : 'none'
                    }}
                  >
                    {segment.rate.toFixed(2)}%
                  </td>
                ))}
              </tr>
              
              <tr className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2 font-semibold text-orange-700">NYC</td>
                {getMergedSegments('NYC').map((segment, segIndex) => (
                  <td 
                    key={segIndex}
                    colSpan={segment.colspan}
                    className="border-l border-t border-b border-gray-300 px-2 py-2 text-center text-sm"
                    style={{ 
                      backgroundColor: getColorIntensity(segment.rate, 'NYC'),
                      borderRight: segIndex === getMergedSegments('NYC').length - 1 ? '1px solid rgb(209, 213, 219)' : 'none'
                    }}
                  >
                    {segment.rate.toFixed(2)}%
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Income Range Toggle */}
      <div className="mb-6 flex justify-center">
        <div className="flex items-center space-x-3 bg-gray-100 rounded-lg p-3">
          <span className="text-sm font-medium text-gray-700">Income Range:</span>
          <button
            onClick={() => setShowExtendedRange(false)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              !showExtendedRange 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Up to $1M
          </button>
          <button
            onClick={() => setShowExtendedRange(true)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              showExtendedRange 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Complete Range
          </button>
        </div>
      </div>

      {/* Effective Tax Rate Table */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-700">
          Effective Tax Rates by Income Level
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left font-semibold">State/City</th>
                {effectiveIncomeLevel.map(income => (
                  <th key={income} className="border border-gray-300 px-3 py-2 text-center font-semibold min-w-20">
                    {formatIncome(income)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-green-50">
                <td className="border border-gray-300 px-4 py-2 font-semibold text-green-700">CT</td>
                {effectiveIncomeLevel.map(income => (
                  <td key={income} className="border border-gray-300 px-3 py-2 text-center">
                    {calculateEffectiveTax(income, 'CT').toFixed(2)}%
                  </td>
                ))}
              </tr>

              <tr className="hover:bg-red-50">
                <td className="border border-gray-300 px-4 py-2 font-semibold text-red-700">NJ</td>
                {effectiveIncomeLevel.map(income => (
                  <td key={income} className="border border-gray-300 px-3 py-2 text-center">
                    {calculateEffectiveTax(income, 'NJ').toFixed(2)}%
                  </td>
                ))}
              </tr>
              
              <tr className="hover:bg-blue-50">
                <td className="border border-gray-300 px-4 py-2 font-semibold text-blue-700">NY State</td>
                {effectiveIncomeLevel.map(income => (
                  <td key={income} className="border border-gray-300 px-3 py-2 text-center">
                    {calculateEffectiveTax(income, 'NY').toFixed(2)}%
                  </td>
                ))}
              </tr>
              
              <tr className="hover:bg-orange-50">
                <td className="border border-gray-300 px-4 py-2 font-semibold text-orange-700">NYC Total</td>
                {effectiveIncomeLevel.map(income => {
                  const nyRate = calculateEffectiveTax(income, 'NY');
                  const nycRate = calculateEffectiveTax(income, 'NYC');
                  const totalRate = nyRate + nycRate;
                  return (
                    <td key={income} className="border border-gray-300 px-3 py-2 text-center">
                      {totalRate.toFixed(2)}%
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Effective Tax Amount Table */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-700">
          Effective Tax Amount by Income Level
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left font-semibold">State/City</th>
                {effectiveIncomeLevel.map(income => (
                  <th key={income} className="border border-gray-300 px-3 py-2 text-center font-semibold min-w-20">
                    {formatIncome(income)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-green-50">
                <td className="border border-gray-300 px-4 py-2 font-semibold text-green-700">CT</td>
                {effectiveIncomeLevel.map(income => (
                  <td key={income} className="border border-gray-300 px-3 py-2 text-center">
                    {calculateEffectiveTaxAmount(income, 'CT')}
                  </td>
                ))}
              </tr>

              <tr className="hover:bg-red-50">
                <td className="border border-gray-300 px-4 py-2 font-semibold text-red-700">NJ</td>
                {effectiveIncomeLevel.map(income => (
                  <td key={income} className="border border-gray-300 px-3 py-2 text-center">
                    {calculateEffectiveTaxAmount(income, 'NJ')}
                  </td>
                ))}
              </tr>
              
              <tr className="hover:bg-blue-50">
                <td className="border border-gray-300 px-4 py-2 font-semibold text-blue-700">NY State</td>
                {effectiveIncomeLevel.map(income => (
                  <td key={income} className="border border-gray-300 px-3 py-2 text-center">
                    {calculateEffectiveTaxAmount(income, 'NY')}
                  </td>
                ))}
              </tr>
              
              <tr className="hover:bg-orange-50">
                <td className="border border-gray-300 px-4 py-2 font-semibold text-orange-700">NYC Total</td>
                {effectiveIncomeLevel.map(income => {
                  const nyRate = calculateEffectiveTax(income, 'NY');
                  const nycRate = calculateEffectiveTax(income, 'NYC');
                  const totalRate = nyRate + nycRate;
                  const taxAmount = (income * totalRate) / 100;
                  return (
                    <td key={income} className="border border-gray-300 px-3 py-2 text-center">
                      {formatTaxAmount(taxAmount)}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Line Chart */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 text-gray-700">
          Effective Tax Amount Comparison
        </h2>
        
        <div className="w-full h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={createChartData()}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis 
                dataKey="incomeLabel" 
                stroke="#666"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                stroke="#666"
                fontSize={12}
                tickFormatter={formatChartAmount}
                label={{ value: 'Tax Amount ($)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                formatter={(value, name) => [formatChartAmount(value), name]}
                labelFormatter={(label) => `Income: ${label}`}
                contentStyle={{
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
              />
              <Line 
                type="monotone" 
                dataKey="CT" 
                stroke="#4caf50" 
                strokeWidth={3}
                dot={{ fill: '#4caf50', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#4caf50', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="NJ" 
                stroke="#f44336" 
                strokeWidth={3}
                dot={{ fill: '#f44336', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#f44336', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="NY State" 
                stroke="#2196f3" 
                strokeWidth={3}
                dot={{ fill: '#2196f3', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#2196f3', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="NYC Total" 
                stroke="#ff9800" 
                strokeWidth={3}
                dot={{ fill: '#ff9800', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#ff9800', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
        
      <div className="mt-6 text-sm text-gray-600 text-center">
        <p><strong>Note:</strong> New York includes $8,000 personal exemption</p>
      </div>
    </div>
  );
};

export default TaxBracketVisualization;