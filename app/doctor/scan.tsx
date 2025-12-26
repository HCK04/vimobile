import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator, Vibration, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, Camera } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../lib/apiClient';

// Color palette matching dashboard
const Palette = {
    primary: '#2563EB',
    primaryLight: '#EFF6FF',
    success: '#10B981',
    successBg: '#D1FAE5',
    warning: '#F59E0B',
    warningBg: '#FEF3C7',
    error: '#EF4444',
    errorBg: '#FEE2E2',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#1E293B',
    textSecondary: '#64748B',
    border: '#E2E8F0',
};

type ScanResult = {
    valid: boolean;
    verification_status: string;
    verification_message: string;
    appointment?: {
        id: number;
        date: string;
        time: string;
        status: string;
        reason: string;
    };
    patient?: {
        id: number;
        name: string;
        email: string;
        phone: string;
    };
    annonce?: {
        id: number;
        title: string;
        price: number;
    };
    error?: string;
    error_code?: string;
};

export default function QRScannerScreen() {
    const router = useRouter();
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ScanResult | null>(null);
    const [checkingIn, setCheckingIn] = useState(false);
    const [completing, setCompleting] = useState(false);

    useEffect(() => {
        const getCameraPermissions = async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
        };
        getCameraPermissions();
    }, []);

    const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
        if (scanned || loading) return;

        setScanned(true);
        setLoading(true);
        Vibration.vibrate(100);

        try {
            // Try to parse the QR code data
            let appointmentId: string | number | null = null;

            try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'appointment' && parsed.id) {
                    appointmentId = parsed.id;
                }
            } catch {
                // If not JSON, try to use the data as appointment ID directly
                if (/^\d+$/.test(data)) {
                    appointmentId = data;
                }
            }

            if (!appointmentId) {
                setResult({
                    valid: false,
                    verification_status: 'invalid',
                    verification_message: 'QR code invalide',
                    error: 'Ce QR code ne correspond pas à un rendez-vous valide',
                    error_code: 'INVALID_QR'
                });
                setLoading(false);
                return;
            }

            // Call the backend to verify
            const response = await apiClient.post(`/doctor/appointments/${appointmentId}/scan-verify`);
            setResult(response.data);
        } catch (error: any) {
            const errorData = error?.response?.data;
            setResult({
                valid: false,
                verification_status: 'error',
                verification_message: errorData?.error || 'Erreur lors de la vérification',
                error: errorData?.error || 'Une erreur est survenue',
                error_code: errorData?.error_code || 'UNKNOWN_ERROR'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        if (!result?.appointment?.id) return;

        setCheckingIn(true);
        try {
            await apiClient.post(`/doctor/appointments/${result.appointment.id}/check-in`);
            Alert.alert('Succès', 'Patient enregistré avec succès', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert('Erreur', error?.response?.data?.error || 'Impossible d\'enregistrer le patient');
        } finally {
            setCheckingIn(false);
        }
    };

    const handleComplete = async () => {
        if (!result?.appointment?.id) return;

        setCompleting(true);
        try {
            await apiClient.put(`/doctor/appointments/${result.appointment.id}/status`, { status: 'completed' });
            Alert.alert('Succès', 'Rendez-vous marqué comme terminé', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert('Erreur', error?.response?.data?.error || 'Impossible de marquer comme terminé');
        } finally {
            setCompleting(false);
        }
    };

    const resetScanner = () => {
        setScanned(false);
        setResult(null);
    };

    const getStatusIcon = () => {
        if (!result) return null;
        switch (result.verification_status) {
            case 'valid':
                return { name: 'checkmark-circle', color: Palette.success };
            case 'future':
                return { name: 'calendar', color: Palette.warning };
            case 'past':
            case 'cancelled':
            case 'already_completed':
                return { name: 'close-circle', color: Palette.error };
            case 'already_checked_in':
                return { name: 'person-circle', color: Palette.warning };
            default:
                return { name: 'alert-circle', color: Palette.error };
        }
    };

    if (hasPermission === null) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Palette.primary} />
                    <Text style={styles.permissionText}>Demande d'accès à la caméra...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (hasPermission === false) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={Palette.text} />
                    </Pressable>
                    <Text style={styles.headerTitle}>Scanner QR</Text>
                    <View style={{ width: 40 }} />
                </View>
                <View style={styles.center}>
                    <Ionicons name="videocam-off" size={64} color={Palette.textSecondary} />
                    <Text style={styles.permissionTitle}>Caméra non autorisée</Text>
                    <Text style={styles.permissionText}>
                        Veuillez autoriser l'accès à la caméra dans les paramètres pour scanner les QR codes.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Palette.text} />
                </Pressable>
                <Text style={styles.headerTitle}>Scanner QR Code</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Camera View */}
            <View style={styles.cameraContainer}>
                <CameraView
                    style={styles.camera}
                    barcodeScannerSettings={{
                        barcodeTypes: ['qr'],
                    }}
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                />

                {/* Overlay with scan frame */}
                <View style={styles.overlay}>
                    <View style={styles.scanFrame}>
                        <View style={[styles.corner, styles.cornerTopLeft]} />
                        <View style={[styles.corner, styles.cornerTopRight]} />
                        <View style={[styles.corner, styles.cornerBottomLeft]} />
                        <View style={[styles.corner, styles.cornerBottomRight]} />
                    </View>
                    <Text style={styles.scanHint}>
                        Placez le QR code du patient dans le cadre
                    </Text>
                </View>

                {/* Loading overlay */}
                {loading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#FFFFFF" />
                        <Text style={styles.loadingText}>Vérification...</Text>
                    </View>
                )}
            </View>

            {/* Result Modal */}
            <Modal visible={!!result} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        {result && (
                            <>
                                {/* Status Icon */}
                                <View style={[styles.statusIconContainer, { backgroundColor: result.valid ? Palette.successBg : Palette.errorBg }]}>
                                    <Ionicons
                                        name={getStatusIcon()?.name as any || 'help-circle'}
                                        size={48}
                                        color={getStatusIcon()?.color || Palette.textSecondary}
                                    />
                                </View>

                                {/* Status Message */}
                                <Text style={[styles.statusTitle, { color: result.valid ? Palette.success : Palette.error }]}>
                                    {result.valid ? 'Rendez-vous valide' : 'Vérification échouée'}
                                </Text>
                                <Text style={styles.statusMessage}>{result.verification_message}</Text>

                                {/* Patient Info */}
                                {result.patient && (
                                    <View style={styles.infoCard}>
                                        <View style={styles.infoRow}>
                                            <Ionicons name="person" size={20} color={Palette.primary} />
                                            <Text style={styles.infoLabel}>Patient</Text>
                                        </View>
                                        <Text style={styles.infoValue}>{result.patient.name}</Text>
                                        {result.patient.phone && (
                                            <Text style={styles.infoSubValue}>{result.patient.phone}</Text>
                                        )}
                                    </View>
                                )}

                                {/* Appointment Info */}
                                {result.appointment && (
                                    <View style={styles.infoCard}>
                                        <View style={styles.infoRow}>
                                            <Ionicons name="calendar" size={20} color={Palette.primary} />
                                            <Text style={styles.infoLabel}>Rendez-vous</Text>
                                        </View>
                                        <Text style={styles.infoValue}>
                                            {result.appointment.date} à {result.appointment.time}
                                        </Text>
                                        <Text style={styles.infoSubValue}>{result.appointment.reason}</Text>
                                    </View>
                                )}

                                {/* Actions */}
                                <View style={styles.actionButtons}>
                                    {/* Check-in button - only if valid and not already checked in */}
                                    {result.valid && result.verification_status === 'valid' && (
                                        <Pressable
                                            style={[styles.actionButton, styles.primaryButton]}
                                            onPress={handleCheckIn}
                                            disabled={checkingIn}
                                        >
                                            {checkingIn ? (
                                                <ActivityIndicator color="#FFFFFF" />
                                            ) : (
                                                <>
                                                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                                                    <Text style={styles.primaryButtonText}>Enregistrer l'arrivée</Text>
                                                </>
                                            )}
                                        </Pressable>
                                    )}

                                    {/* Mark as Complete button - for valid or already_checked_in */}
                                    {result.appointment && (result.valid || result.verification_status === 'already_checked_in') && (
                                        <Pressable
                                            style={[styles.actionButton, styles.completeButton]}
                                            onPress={handleComplete}
                                            disabled={completing}
                                        >
                                            {completing ? (
                                                <ActivityIndicator color="#FFFFFF" />
                                            ) : (
                                                <>
                                                    <Ionicons name="checkmark-done-circle" size={20} color="#FFFFFF" />
                                                    <Text style={styles.completeButtonText}>Marquer comme terminé</Text>
                                                </>
                                            )}
                                        </Pressable>
                                    )}

                                    {result.appointment && (
                                        <Pressable
                                            style={[styles.actionButton, styles.secondaryButton]}
                                            onPress={() => {
                                                router.push(`/doctor/appointments/${result.appointment!.id}` as any);
                                            }}
                                        >
                                            <Ionicons name="eye" size={20} color={Palette.primary} />
                                            <Text style={styles.secondaryButtonText}>Voir les détails</Text>
                                        </Pressable>
                                    )}

                                    <Pressable style={[styles.actionButton, styles.outlineButton]} onPress={resetScanner}>
                                        <Ionicons name="scan" size={20} color={Palette.textSecondary} />
                                        <Text style={styles.outlineButtonText}>Scanner un autre</Text>
                                    </Pressable>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Palette.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Palette.surface,
        borderBottomWidth: 1,
        borderBottomColor: Palette.border,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Palette.text,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    permissionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Palette.text,
        marginTop: 16,
    },
    permissionText: {
        fontSize: 14,
        color: Palette.textSecondary,
        textAlign: 'center',
        marginTop: 8,
    },
    cameraContainer: {
        flex: 1,
        position: 'relative',
    },
    camera: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scanFrame: {
        width: 250,
        height: 250,
        position: 'relative',
    },
    corner: {
        width: 40,
        height: 40,
        position: 'absolute',
        borderColor: '#FFFFFF',
    },
    cornerTopLeft: {
        top: 0,
        left: 0,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderTopLeftRadius: 12,
    },
    cornerTopRight: {
        top: 0,
        right: 0,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderTopRightRadius: 12,
    },
    cornerBottomLeft: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderBottomLeftRadius: 12,
    },
    cornerBottomRight: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderBottomRightRadius: 12,
    },
    scanHint: {
        color: '#FFFFFF',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 24,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        color: '#FFFFFF',
        fontSize: 16,
        marginTop: 12,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalCard: {
        backgroundColor: Palette.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
        alignItems: 'center',
    },
    statusIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    statusTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
    },
    statusMessage: {
        fontSize: 14,
        color: Palette.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
    },
    infoCard: {
        width: '100%',
        backgroundColor: Palette.primaryLight,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    infoLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: Palette.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '600',
        color: Palette.text,
    },
    infoSubValue: {
        fontSize: 14,
        color: Palette.textSecondary,
        marginTop: 4,
    },
    actionButtons: {
        width: '100%',
        gap: 12,
        marginTop: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
    },
    primaryButton: {
        backgroundColor: Palette.success,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    completeButton: {
        backgroundColor: Palette.primary,
    },
    completeButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    secondaryButton: {
        backgroundColor: Palette.primaryLight,
    },
    secondaryButtonText: {
        color: Palette.primary,
        fontSize: 15,
        fontWeight: '600',
    },
    outlineButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Palette.border,
    },
    outlineButtonText: {
        color: Palette.textSecondary,
        fontSize: 15,
        fontWeight: '600',
    },
});
