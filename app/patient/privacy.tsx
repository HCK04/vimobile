import React from 'react';
import {
    SafeAreaView,
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const PRIVACY_URL = 'https://vi-sante.ma/confidentialite';
const TERMS_URL = 'https://vi-sante.ma/conditions';

export default function PrivacyScreen() {
    const router = useRouter();

    const openURL = async (url: string) => {
        try {
            await Linking.openURL(url);
        } catch (error) {
            console.error('Error opening URL:', error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </Pressable>
                <Text style={styles.headerTitle}>Confidentialité</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Privacy Policy */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="shield-checkmark" size={24} color="#2563EB" />
                        <Text style={styles.cardTitle}>Politique de Confidentialité</Text>
                    </View>
                    <Text style={styles.cardDescription}>
                        Découvrez comment nous collectons, utilisons et protégeons vos données personnelles.
                    </Text>
                    <Pressable style={styles.linkButton} onPress={() => openURL(PRIVACY_URL)}>
                        <Text style={styles.linkButtonText}>Lire la politique de confidentialité</Text>
                        <Ionicons name="open-outline" size={18} color="#2563EB" />
                    </Pressable>
                </View>

                {/* Terms of Service */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="document-text" size={24} color="#10B981" />
                        <Text style={styles.cardTitle}>Conditions d'Utilisation</Text>
                    </View>
                    <Text style={styles.cardDescription}>
                        Consultez les conditions générales d'utilisation de l'application Vi-Santé.
                    </Text>
                    <Pressable style={styles.linkButton} onPress={() => openURL(TERMS_URL)}>
                        <Text style={styles.linkButtonText}>Lire les conditions d'utilisation</Text>
                        <Ionicons name="open-outline" size={18} color="#2563EB" />
                    </Pressable>
                </View>

                {/* Data Handling */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="server" size={24} color="#8B5CF6" />
                        <Text style={styles.cardTitle}>Gestion de vos Données</Text>
                    </View>

                    <View style={styles.dataItem}>
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        <Text style={styles.dataText}>Données chiffrées en transit et au repos</Text>
                    </View>

                    <View style={styles.dataItem}>
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        <Text style={styles.dataText}>Aucune vente de données à des tiers</Text>
                    </View>

                    <View style={styles.dataItem}>
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        <Text style={styles.dataText}>Droit à l'effacement de vos données</Text>
                    </View>

                    <View style={styles.dataItem}>
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                        <Text style={styles.dataText}>Hébergement au Maroc conforme à la CNDP</Text>
                    </View>
                </View>

                {/* Contact */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="mail" size={24} color="#F59E0B" />
                        <Text style={styles.cardTitle}>Nous Contacter</Text>
                    </View>
                    <Text style={styles.cardDescription}>
                        Pour toute question concernant vos données personnelles :
                    </Text>
                    <Pressable
                        style={styles.linkButton}
                        onPress={() => Linking.openURL('mailto:privacy@vi-sante.ma')}
                    >
                        <Text style={styles.linkButtonText}>privacy@vi-sante.ma</Text>
                        <Ionicons name="mail-outline" size={18} color="#2563EB" />
                    </Pressable>
                </View>

                <View style={{ height: 32 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    content: {
        padding: 16,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111827',
    },
    cardDescription: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 12,
    },
    linkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: '#EFF6FF',
        borderRadius: 10,
    },
    linkButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2563EB',
    },
    dataItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 8,
    },
    dataText: {
        fontSize: 14,
        color: '#374151',
        flex: 1,
    },
});
