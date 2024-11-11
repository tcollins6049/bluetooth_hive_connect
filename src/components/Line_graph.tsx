import React, { useState } from 'react';
import { View, Dimensions, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Rect, Text as TextSVG, Svg } from "react-native-svg";


/**
 * Variables used in the line graph
 */
interface LineGraphProps {
  // labels and values displayed in the chart
  chartData: {
    labels: string[];
    datasets: {
      data: number[];
    }[];
  };
  color_code: string  // What color to make chart
}


/**
 * Given data, creates line graph using that data for points
 * 
 * @param
 * @returns {JSX.Element} Line graph with passed in chartData
 */
const LineGraph: React.FC<LineGraphProps> = ({ chartData, color_code }) => {
  let [tooltipPos, setTooltipPos] = useState({x: 0, y: 0, visible: false, value: 0})

  return (
    <View>
        {chartData && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <LineChart
            data={chartData}
            width={Dimensions.get('window').width * 0.92}
            height={220}
            fromZero={true}
            // withVerticalLabels={false}
            yAxisInterval={2}
            withDots={true}
            chartConfig={{
              backgroundColor: color_code,
              // backgroundGradientFrom: '#fb8c00',
              backgroundGradientFrom: color_code,
              // backgroundGradientTo: '#ffa726',
              backgroundGradientTo: '#50e0fa',
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '3',
                strokeWidth: '2',
                stroke: '#fae34d',
              },
            }}

            /* Determines when labels are displayed */
            formatXLabel={value => {
              const index = chartData.labels.indexOf(value);
              const data_length = chartData.labels.length;

              if (data_length < 15) {
                return index % 2 === 0 ? value : '';
              } else if (data_length < 30) {
                return index % 3 === 0 ? value : '';
              } else if (data_length < 100) {
                return index % 5 === 0 ? value : '';
              }
              return index % 10 === 0 ? value : '';
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}

            decorator={() => {
              return tooltipPos.visible ? <View>
                  <Svg>
                      <Rect 
                          x={tooltipPos.x - 15} 
                          y={tooltipPos.y + 10} 
                          width="60" 
                          height="30"
                          opacity={.5}
                          fill="blue" />
                          <TextSVG
                              x={tooltipPos.x + 5}
                              y={tooltipPos.y + 30}
                              fill="white"
                              fontSize="16"
                              fontWeight="bold"
                              textAnchor="middle">
                              {tooltipPos.value.toFixed(2)}
                          </TextSVG>
                  </Svg>
              </View> : null
            }}

            /* Determines what happens when a point on the graph is clicked */
            onDataPointClick={(data) => {
              let isSamePoint = (tooltipPos.x === data.x 
                                  && tooltipPos.y === data.y)

              isSamePoint ? setTooltipPos((previousState) => {
                  return { 
                            ...previousState,
                            value: data.value,
                            visible: !previousState.visible
                         }
              })
                  : 
              setTooltipPos({ x: data.x, value: data.value, y: data.y, visible: true });
            }}
          />
          </ScrollView>
        )}
    </View>
  );
};
  

export default LineGraph;
