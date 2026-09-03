import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Flame, CheckSquare, LayoutGrid, Bell, User } from 'lucide-react-native';

import { RootStackParamList, MainTabParamList } from '../types';
import { THEME } from '../config/constants';

// Screens
import { HomeScreen } from '../screens/HomeScreen';
import { IpoDetailScreen } from '../screens/IpoDetailScreen';
import { AllotmentScreen } from '../screens/AllotmentScreen';
import { SectorsScreen } from '../screens/SectorsScreen';
import { AlertsScreen } from '../screens/AlertsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0a0e1a',
          borderTopColor: '#1e293b',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: THEME.colors.primaryLight,
        tabBarInactiveTintColor: THEME.colors.textDim,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Flame color={color} size={20} />,
        }}
      />
      <Tab.Screen
        name="Allotment"
        component={AllotmentScreen}
        options={{
          tabBarLabel: 'Allotment',
          tabBarIcon: ({ color, size }) => <CheckSquare color={color} size={20} />,
        }}
      />
      <Tab.Screen
        name="Sectors"
        component={SectorsScreen}
        options={{
          tabBarLabel: 'Sectors',
          tabBarIcon: ({ color, size }) => <LayoutGrid color={color} size={20} />,
        }}
      />
      <Tab.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{
          tabBarLabel: 'Alerts',
          tabBarIcon: ({ color, size }) => <Bell color={color} size={20} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={20} />,
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0d1322',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '800',
            fontSize: 16,
          },
          headerBackVisible: true,
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="IpoDetail"
          component={IpoDetailScreen}
          options={({ route }) => ({
            title: route.params?.title || 'IPO Details',
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
