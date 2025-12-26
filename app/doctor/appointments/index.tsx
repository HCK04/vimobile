import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Pressable, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../../lib/apiClient';
import { Palette } from '../../../constants/Colors';

type FilterType = 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled';

export default function AppointmentsListScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [items, setItems] = useState<any[]>([]);
    const [filter, setFilter] = useState<FilterType>('all');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.get('/doctor/appointments');
            setItems(Array.isArray(data) ? data : []);
        } catch (e) {
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const onRefresh = async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    };

    const filtered = items.filter(item => {
        if (filter === 'all') return true;
        return item.status?.toLowerCase() === filter;
    });

    const filters: { key: FilterType; label: string }[] = [
        { key: 'all', label: 'Tous' },
        { key: 'pending', label: 'En attente' },
        { key: 'confirmed', label: 'Confirmés' },
        { key: 'completed', label: 'Terminés' },
    ];

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'confirmed': return Palette.success;
            case 'pending': return '#F59E0B';
            case 'completed': return '#8B5CF6';
            case 'cancelled': case 'canceled': return Palette.error;
            default: return Palette.textPlaceholder;
        }
    };

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Palette.primary} />
                    <Text style={styles.loadingText}>Chargement...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header with accent line */}
            <View style={styles.headerContainer}>
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={22} color={Palette.text} />
                    </Pressable>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerTitle}>Mes rendez-vous</Text>
                        <Text style={styles.headerSubtitle}>{filtered.length} rendez-vous</Text>
                    </View>
                </View>
                <View style={styles.accentLine} />
            </View>

            {/* Filter Pills */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScroll}
                style={styles.filterContainer}
            >
                {filters.map(f => (
                    <Pressable
                        key={f.key}
                        onPress={() => setFilter(f.key)}
                        style={[styles.filterPill, filter === f.key && styles.filterPillActive]}
                    >
                        <Text style={[styles.filterPillText, filter === f.key && styles.filterPillTextActive]}>
                            {f.label}
                        </Text>
                    </Pressable>
                ))}
            </ScrollView>

            {/* Appointments List */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[Palette.primary]}
                        tintColor={Palette.primary}
                    />
                }
                contentContainerStyle={styles.listContent}
            >
                {filtered.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="calendar-outline" size={48} color={Palette.textPlaceholder} />
                        <Text style={styles.emptyTitle}>Aucun rendez-vous</Text>
                        <Text style={styles.emptySubtitle}>
                            {filter === 'all'
                                ? 'Vos rendez-vous apparaîtront ici'
                                : `Aucun rendez-vous ${filters.find(f => f.key === filter)?.label.toLowerCase()}`}
                        </Text>
                    </View>
                ) : (
                    filtered.map((item, index) => (
                        <Pressable
                            key={item.id || index}
                            style={styles.appointmentCard}
                            onPress={() => router.push(`/doctor/appointments/${item.id}` as any)}
                        >
                            <View style={styles.appointmentInfo}>
                                <Text style={styles.appointmentPatient}>
                                    {item.patient?.name || item.patient_name || 'Patient'}
                                </Text>
                                <Text style={styles.appointmentTime}>
                                    {item.date_time
                                        ? new Date(item.date_time).toLocaleString('fr-FR', {
                                            dateStyle: 'medium',
                                            timeStyle: 'short'
                                        })
                                        : item.date || '—'}
                                </Text>
                                {item.reason && (
                                    <Text style={styles.appointmentReason} numberOfLines={1}>
                                        {item.reason}
                                    </Text>
                                )}
                            </View>
                            <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                        </Pressable>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Palette.background },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadingText: { marginTop: 16, fontSize: 15, color: Palette.textSecondary },

    // Header - matches dashboard style
    headerContainer: { backgroundColor: Palette.surface, paddingBottom: 0 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Palette.background, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    headerTitle: { fontSize: 24, fontWeight: '800', color: Palette.text, letterSpacing: -0.5 },
    headerSubtitle: { fontSize: 14, color: Palette.textSecondary, marginTop: 2 },
    accentLine: { height: 3, backgroundColor: Palette.primary, marginHorizontal: 20, marginBottom: 4, borderRadius: 2, width: 40 },

    // Filters - dashboard pill style
    filterContainer: { backgroundColor: Palette.surface, paddingBottom: 16 },
    filterScroll: { paddingHorizontal: 20 },
    filterPill: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 24, backgroundColor: Palette.background, marginRight: 10, borderWidth: 1, borderColor: Palette.border },
    filterPillActive: { backgroundColor: Palette.primaryLight, borderColor: Palette.primaryBorder },
    filterPillText: { fontSize: 14, fontWeight: '600', color: Palette.textSecondary },
    filterPillTextActive: { color: Palette.primary },

    // List
    listContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32 },

    // Empty state
    emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, backgroundColor: Palette.surface, borderRadius: 16, marginTop: 8 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: Palette.text, marginTop: 16 },
    emptySubtitle: { fontSize: 14, color: Palette.textSecondary, marginTop: 4, textAlign: 'center' },

    // Appointment card - matches dashboard style
    appointmentCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Palette.surface, marginBottom: 10, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: Palette.border },
    appointmentInfo: { flex: 1 },
    appointmentPatient: { fontSize: 16, fontWeight: '600', color: Palette.text },
    appointmentTime: { fontSize: 13, color: Palette.textSecondary, marginTop: 2 },
    appointmentReason: { fontSize: 12, color: Palette.textPlaceholder, marginTop: 4 },
    statusDot: { width: 10, height: 10, borderRadius: 5 },
});
