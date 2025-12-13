import React, { useCallback, useState } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Modal,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { apiClient } from '../../lib/apiClient';

interface FamilyMember {
    id: number;
    name: string;
    relationship: string;
    age: number | null;
    email: string | null;
    phone: string | null;
    blood_type: string | null;
    discount_percentage: string;
}

interface UserProfile {
    subscription_type: string | null;
    is_subscribed: boolean;
}

export default function FamilleScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [addingMember, setAddingMember] = useState(false);
    const [newMember, setNewMember] = useState({
        name: '',
        relationship: 'conjoint',
        age: '',
        email: '',
        phone: '',
    });

    const relationships = [
        { key: 'conjoint', label: 'Conjoint(e)' },
        { key: 'enfant', label: 'Enfant' },
        { key: 'parent', label: 'Parent' },
        { key: 'frère/sœur', label: 'Frère/Sœur' },
        { key: 'autre', label: 'Autre' },
    ];

    const loadData = useCallback(async () => {
        try {
            // Load user profile and family members in parallel
            const [profileRes, familyRes] = await Promise.all([
                apiClient.get('/user/profile'),
                apiClient.get('/family-members'),
            ]);

            setUserProfile(profileRes.data);

            // Handle both array and object response
            const data = familyRes.data;
            if (Array.isArray(data)) {
                setFamilyMembers(data);
            } else if (data && Array.isArray(data.data)) {
                setFamilyMembers(data.data);
            } else {
                setFamilyMembers([]);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const hasFamilySubscription = userProfile?.subscription_type === 'family' && userProfile?.is_subscribed;

    const addFamilyMember = async () => {
        if (!newMember.name.trim()) {
            Alert.alert('Erreur', 'Le nom est obligatoire');
            return;
        }
        if (!newMember.relationship) {
            Alert.alert('Erreur', 'La relation est obligatoire');
            return;
        }

        setAddingMember(true);
        try {
            const response = await apiClient.post('/family-members', {
                name: newMember.name,
                relationship: newMember.relationship,
                age: newMember.age ? parseInt(newMember.age) : null,
                email: newMember.email || null,
                phone: newMember.phone || null,
            });

            setFamilyMembers([response.data, ...familyMembers]);
            setShowAddModal(false);
            setNewMember({ name: '', relationship: 'conjoint', age: '', email: '', phone: '' });
            Alert.alert('Succès', 'Membre ajouté avec succès');
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Erreur lors de l\'ajout';
            Alert.alert('Erreur', message);
        } finally {
            setAddingMember(false);
        }
    };

    const deleteFamilyMember = (member: FamilyMember) => {
        Alert.alert(
            'Supprimer',
            `Êtes-vous sûr de vouloir supprimer ${member.name} ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await apiClient.delete(`/family-members/${member.id}`);
                            setFamilyMembers(familyMembers.filter(m => m.id !== member.id));
                        } catch (error: any) {
                            const message = error?.response?.data?.message || 'Erreur lors de la suppression';
                            Alert.alert('Erreur', message);
                        }
                    },
                },
            ]
        );
    };

    const getRelationshipLabel = (key: string) => {
        return relationships.find(r => r.key === key)?.label || key;
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.loadingText}>Chargement...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Upgrade prompt for non-subscribers
    if (!hasFamilySubscription) {
        return (
            <SafeAreaView style={styles.container}>
                <ScrollView contentContainerStyle={styles.upgradeContainer}>
                    {/* Icon */}
                    <View style={styles.upgradeIcon}>
                        <Ionicons name="people" size={48} color="#3B82F6" />
                    </View>

                    {/* Title */}
                    <Text style={styles.upgradeTitle}>Abonnement Famille</Text>

                    {/* Description */}
                    <Text style={styles.upgradeDescription}>
                        Gérez la santé de toute votre famille avec un seul compte.
                        Ajoutez jusqu'à 5 membres et bénéficiez de réductions exclusives.
                    </Text>

                    {/* Benefits */}
                    <View style={styles.benefitsContainer}>
                        <View style={styles.benefitCard}>
                            <Ionicons name="people-outline" size={28} color="#3B82F6" />
                            <Text style={styles.benefitTitle}>5 Membres</Text>
                            <Text style={styles.benefitText}>Ajoutez jusqu'à 5 membres</Text>
                        </View>

                        <View style={[styles.benefitCard, { backgroundColor: '#ECFDF5' }]}>
                            <Ionicons name="cash-outline" size={28} color="#10B981" />
                            <Text style={styles.benefitTitle}>10% Réduction</Text>
                            <Text style={styles.benefitText}>Sur les consultations</Text>
                        </View>

                        <View style={[styles.benefitCard, { backgroundColor: '#F5F3FF' }]}>
                            <Ionicons name="calendar-outline" size={28} color="#8B5CF6" />
                            <Text style={styles.benefitTitle}>Gestion Centralisée</Text>
                            <Text style={styles.benefitText}>Tous les rendez-vous</Text>
                        </View>
                    </View>

                    {/* Pricing */}
                    <View style={styles.pricingCard}>
                        <Text style={styles.pricingAmount}>199 DH</Text>
                        <Text style={styles.pricingPeriod}>/mois</Text>
                    </View>

                    {/* CTA */}
                    <Pressable
                        style={styles.ctaButton}
                        onPress={() => Alert.alert('Information', 'La souscription sera bientôt disponible. Contactez-nous pour plus d\'informations.')}
                    >
                        <Text style={styles.ctaButtonText}>Souscrire maintenant</Text>
                    </Pressable>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // Family members list for subscribers
    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Ma Famille</Text>
                <Pressable style={styles.addButton} onPress={() => setShowAddModal(true)}>
                    <Ionicons name="add" size={24} color="#FFFFFF" />
                </Pressable>
            </View>

            <ScrollView
                contentContainerStyle={styles.listContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#3B82F6']} />
                }
            >
                {familyMembers.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="people-outline" size={64} color="#94A3B8" />
                        <Text style={styles.emptyTitle}>Aucun membre</Text>
                        <Text style={styles.emptyText}>
                            Ajoutez des membres de votre famille pour gérer leurs rendez-vous
                        </Text>
                        <Pressable style={styles.emptyButton} onPress={() => setShowAddModal(true)}>
                            <Ionicons name="add" size={20} color="#FFFFFF" />
                            <Text style={styles.emptyButtonText}>Ajouter un membre</Text>
                        </Pressable>
                    </View>
                ) : (
                    familyMembers.map((member) => (
                        <View key={member.id} style={styles.memberCard}>
                            <View style={styles.memberAvatar}>
                                <Text style={styles.memberInitial}>{member.name.charAt(0).toUpperCase()}</Text>
                            </View>
                            <View style={styles.memberInfo}>
                                <Text style={styles.memberName}>{member.name}</Text>
                                <Text style={styles.memberRelation}>{getRelationshipLabel(member.relationship)}</Text>
                                {member.age && <Text style={styles.memberDetail}>{member.age} ans</Text>}
                            </View>
                            <View style={styles.memberActions}>
                                <Pressable
                                    style={styles.deleteButton}
                                    onPress={() => deleteFamilyMember(member)}
                                >
                                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                </Pressable>
                            </View>
                        </View>
                    ))
                )}

                {/* Member count */}
                {familyMembers.length > 0 && (
                    <Text style={styles.countText}>
                        {familyMembers.length}/5 membres
                    </Text>
                )}
            </ScrollView>

            {/* Add Member Modal */}
            <Modal visible={showAddModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Ajouter un membre</Text>
                            <Pressable onPress={() => setShowAddModal(false)}>
                                <Ionicons name="close" size={24} color="#64748B" />
                            </Pressable>
                        </View>

                        <ScrollView style={styles.modalForm}>
                            <Text style={styles.inputLabel}>Nom complet *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Nom du membre"
                                value={newMember.name}
                                onChangeText={(text) => setNewMember({ ...newMember, name: text })}
                            />

                            <Text style={styles.inputLabel}>Relation *</Text>
                            <View style={styles.relationshipPicker}>
                                {relationships.map((rel) => (
                                    <Pressable
                                        key={rel.key}
                                        style={[
                                            styles.relationshipOption,
                                            newMember.relationship === rel.key && styles.relationshipSelected,
                                        ]}
                                        onPress={() => setNewMember({ ...newMember, relationship: rel.key })}
                                    >
                                        <Text
                                            style={[
                                                styles.relationshipText,
                                                newMember.relationship === rel.key && styles.relationshipTextSelected,
                                            ]}
                                        >
                                            {rel.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>

                            <Text style={styles.inputLabel}>Âge</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Âge"
                                keyboardType="numeric"
                                value={newMember.age}
                                onChangeText={(text) => setNewMember({ ...newMember, age: text })}
                            />

                            <Text style={styles.inputLabel}>Email</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="email@example.com"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={newMember.email}
                                onChangeText={(text) => setNewMember({ ...newMember, email: text })}
                            />

                            <Text style={styles.inputLabel}>Téléphone</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0600000000"
                                keyboardType="phone-pad"
                                value={newMember.phone}
                                onChangeText={(text) => setNewMember({ ...newMember, phone: text })}
                            />
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <Pressable style={styles.cancelButton} onPress={() => setShowAddModal(false)}>
                                <Text style={styles.cancelButtonText}>Annuler</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.submitButton, addingMember && styles.submitButtonDisabled]}
                                onPress={addFamilyMember}
                                disabled={addingMember}
                            >
                                {addingMember ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.submitButtonText}>Ajouter</Text>
                                )}
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#64748B',
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1E293B',
    },
    addButton: {
        backgroundColor: '#3B82F6',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // List
    listContainer: {
        padding: 16,
    },

    // Empty state
    emptyState: {
        alignItems: 'center',
        paddingVertical: 48,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1E293B',
        marginTop: 16,
    },
    emptyText: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 32,
    },
    emptyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3B82F6',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 24,
    },
    emptyButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        marginLeft: 8,
    },

    // Member card
    memberCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    memberAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#DBEAFE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    memberInitial: {
        fontSize: 20,
        fontWeight: '600',
        color: '#3B82F6',
    },
    memberInfo: {
        flex: 1,
        marginLeft: 12,
    },
    memberName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
    },
    memberRelation: {
        fontSize: 14,
        color: '#3B82F6',
        marginTop: 2,
    },
    memberDetail: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    memberActions: {
        flexDirection: 'row',
    },
    deleteButton: {
        padding: 8,
    },
    countText: {
        textAlign: 'center',
        color: '#64748B',
        fontSize: 14,
        marginTop: 8,
    },

    // Upgrade prompt
    upgradeContainer: {
        padding: 24,
        alignItems: 'center',
    },
    upgradeIcon: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#DBEAFE',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    upgradeTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 12,
    },
    upgradeDescription: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    benefitsContainer: {
        width: '100%',
        marginBottom: 24,
    },
    benefitCard: {
        backgroundColor: '#EFF6FF',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    benefitTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
        marginTop: 8,
    },
    benefitText: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 4,
    },
    pricingCard: {
        flexDirection: 'row',
        alignItems: 'baseline',
        backgroundColor: '#3B82F6',
        paddingHorizontal: 32,
        paddingVertical: 20,
        borderRadius: 16,
        marginBottom: 24,
    },
    pricingAmount: {
        fontSize: 36,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    pricingPeriod: {
        fontSize: 18,
        color: '#BFDBFE',
        marginLeft: 4,
    },
    ctaButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
    },
    ctaButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1E293B',
    },
    modalForm: {
        padding: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        marginBottom: 16,
    },
    relationshipPicker: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    relationshipOption: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    relationshipSelected: {
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6',
    },
    relationshipText: {
        fontSize: 14,
        color: '#374151',
    },
    relationshipTextSelected: {
        color: '#FFFFFF',
    },
    modalActions: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748B',
    },
    submitButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#3B82F6',
        alignItems: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
