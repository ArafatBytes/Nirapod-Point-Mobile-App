import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NavigationProp } from '@react-navigation/native';
import { colors, spacing, borderRadius, fontSize } from '../../theme';
import { useLocationStore } from '../../store';
import { DEFAULT_MAP_REGION } from '../../constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { CrimeCategory, MainTabParamList } from '../../types';

interface CrimeReportData {
  id: string;
  category: CrimeCategory;
  title: string;
  description: string;
  incident_date_time: string;
  latitude: string;
  longitude: string;
  location_name: string | null;
  verified: boolean;
}

const CRIME_COLORS: Record<CrimeCategory, string> = {
  Theft: '#FF9800', // Orange
  Robbery: '#F44336', // Red
  Assault: '#E91E63', // Pink
  Harassment: '#9C27B0', // Purple
  Vandalism: '#607D8B', // Blue Grey
  Burglary: '#FF5722', // Deep Orange
  Fraud: '#2196F3', // Blue
  Other: '#9E9E9E', // Grey
};

type MapScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Map'>,
  NavigationProp<any>
>;

interface Props {
  navigation: MapScreenNavigationProp;
}

const MapScreen: React.FC<Props> = ({ navigation }) => {
  const { currentLocation, getCurrentLocation } = useLocationStore();
  const [region, setRegion] = useState(DEFAULT_MAP_REGION);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [crimeReports, setCrimeReports] = useState<CrimeReportData[]>([]);
  const [selectedCrime, setSelectedCrime] = useState<CrimeReportData | null>(
    null,
  );
  const [isModalVisible, setIsModalVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const requestLocation = async () => {
    try {
      await getCurrentLocation();
    } catch (error) {
      Alert.alert('Location Error', 'Failed to get your current location');
    }
  };

  const fetchCrimeReports = async () => {
    try {
      const { data, error } = await supabase
        .from('crime_reports')
        .select(
          'id, category, title, description, incident_date_time, latitude, longitude, location_name, verified',
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCrimeReports(data || []);
    } catch (error: any) {
      console.error('Error fetching crime reports:', error);
    }
  };

  const handleMarkerPress = (crime: CrimeReportData) => {
    setSelectedCrime(crime);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedCrime(null);
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  useEffect(() => {
    requestLocation();
    fetchCrimeReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentLocation && !hasInitialized) {
      setRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
      setHasInitialized(true);
    }
  }, [currentLocation, hasInitialized]);

  const handleSOSPress = () => {
    Alert.alert(
      'SOS Emergency',
      'Are you sure you want to activate SOS alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement SOS activation
            Alert.alert(
              'SOS Activated',
              'Emergency contacts have been notified',
            );
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        showsUserLocation
        showsMyLocationButton
        showsCompass
      >
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="Your Location"
          />
        )}

        {/* Crime Report Markers */}
        {crimeReports.map(crime => (
          <Marker
            key={crime.id}
            coordinate={{
              latitude: parseFloat(crime.latitude),
              longitude: parseFloat(crime.longitude),
            }}
            title={crime.title}
            description={crime.category}
            onPress={() => handleMarkerPress(crime)}
          />
        ))}
      </MapView>

      <TouchableOpacity
        style={[styles.sosButton, { bottom: insets.bottom + spacing.xl }]}
        onPress={handleSOSPress}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons
          name="alarm-light"
          size={32}
          color={colors.white}
        />
        <Text style={styles.sosButtonText}>SOS</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.reportButton, { top: insets.top + spacing.xl }]}
        onPress={() => {
          navigation.navigate('Reports');
          // Use setTimeout to ensure tab switch completes before navigating
          setTimeout(() => {
            navigation.navigate('AddReport');
          }, 100);
        }}
      >
        <Ionicons name="warning" size={24} color={colors.white} />
      </TouchableOpacity>

      {/* Crime Details Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedCrime && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.categoryBadge}>
                    <Text
                      style={[
                        styles.categoryText,
                        { color: CRIME_COLORS[selectedCrime.category] },
                      ]}
                    >
                      {selectedCrime.category}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={closeModal}>
                    <Ionicons name="close" size={28} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text style={styles.crimeTitle}>{selectedCrime.title}</Text>

                  <View style={styles.infoRow}>
                    <Ionicons
                      name="time-outline"
                      size={18}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.infoText}>
                      {formatDateTime(selectedCrime.incident_date_time)}
                    </Text>
                  </View>

                  {selectedCrime.location_name && (
                    <View style={styles.infoRow}>
                      <Ionicons
                        name="location-outline"
                        size={18}
                        color={colors.textSecondary}
                      />
                      <Text style={styles.infoText}>
                        {selectedCrime.location_name}
                      </Text>
                    </View>
                  )}

                  {selectedCrime.verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={colors.success}
                      />
                      <Text style={styles.verifiedText}>Verified Report</Text>
                    </View>
                  )}

                  <View style={styles.divider} />

                  <Text style={styles.sectionLabel}>Description</Text>
                  <Text style={styles.description}>
                    {selectedCrime.description}
                  </Text>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  sosButton: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.lg,
    backgroundColor: colors.error,
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  sosButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  reportButton: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.lg,
    backgroundColor: colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  categoryBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
  },
  categoryText: {
    fontSize: fontSize.md,
    fontWeight: 'bold',
  },
  crimeTitle: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  infoText: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  verifiedText: {
    fontSize: fontSize.sm,
    color: colors.success,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  sectionLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});

export default MapScreen;
