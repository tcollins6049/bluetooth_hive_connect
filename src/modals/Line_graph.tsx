import React from 'react';
import { View, Text, Dimensions, TouchableOpacity, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

interface LineGraphProps {
    chartData: {
      labels: string[];
      datasets: {
        data: number[];
      }[];
    };
}

const LineGraph: React.FC<LineGraphProps> = ({
    chartData,
  }) => {
  return (
    <View>
        {chartData && (
          <LineChart
            onDataPointClick={({ value, getColor}) =>
              {console.log(`Value: ${value}`)}
            }
            data={chartData}
            width={Dimensions.get('window').width * 0.92}
            height={220}
            chartConfig={{
              backgroundColor: '#e26a00',
              backgroundGradientFrom: '#fb8c00',
              backgroundGradientTo: '#ffa726',
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#ffa726',
              },
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        )}

        {/*{isSelected && tooltipPosition && (
          <View style={[styles.tooltip, { left: tooltipPosition.x, top: tooltipPosition.y }]}>
            <Text style={styles.tooltipText}>{`${selectedData?.label}: ${selectedData?.value}`}</Text>
            <TouchableOpacity onPress={clearSelectedData} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        )}*/}
      
    </View>
  );
};
  

export default LineGraph;
