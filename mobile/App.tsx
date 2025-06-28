import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import MatchesScreen from './src/screens/MatchesScreen';

const Stack = createNativeStackNavigator();

function App(): React.JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Matches"
          component={MatchesScreen}
          options={{title: 'Your Matches'}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App; 