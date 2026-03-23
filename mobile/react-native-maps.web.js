// Mock for react-native-maps on web
import React from 'react';
import { View, Text } from 'react-native';

const MapView = (props) => <View {...props}><Text>Map (web not supported)</Text></View>;
const Marker = () => null;
const Polygon = () => null;

export default MapView;
export { Marker, Polygon };
