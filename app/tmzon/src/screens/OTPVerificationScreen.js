import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Vibration,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as api from '../api/client';

const OTP_LENGTH = 6;
const COUNTDOWN_SECONDS = 60;

export default function OTPVerificationScreen({ navigation, route }) {
  const phone = route?.params?.phone || '+90*****';
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const formatCountdown = useCallback(() => {
    const mins = Math.floor(countdown / 60);
    const secs = countdown % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, [countdown]);

  async function handleVerify(otpCode) {
    if (otpCode.length < OTP_LENGTH) return;
    setError('');
    setLoading(true);
    try {
      await api.verifyPhoneOTP(phone, otpCode);
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (e) {
      setError(e.message);
      setCode('');
      Vibration.vibrate(200);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!canResend) return;
    try {
      await api.sendPhoneOTP(phone);
      setCountdown(COUNTDOWN_SECONDS);
      setCanResend(false);
      setCode('');
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }

  function handleNumpadPress(key) {
    if (loading) return;
    if (key === 'delete') {
      setCode((prev) => prev.slice(0, -1));
      setError('');
    } else if (key === 'empty') {
      return;
    } else {
      const newCode = code + key;
      if (newCode.length <= OTP_LENGTH) {
        setCode(newCode);
        setError('');
        if (newCode.length === OTP_LENGTH) {
          handleVerify(newCode);
        }
      }
    }
  }

  const maskedPhone = phone.length > 4
    ? phone.slice(0, -4).replace(/./g, '*') + phone.slice(-4)
    : phone;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#14171A" />
        </TouchableOpacity>
      </View>

      {/* Title Section */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>Verification Code</Text>
        <Text style={styles.subtitle}>
          We sent a code to{' '}
          <Text style={styles.phoneHighlight}>{maskedPhone}</Text>
        </Text>
      </View>

      {/* OTP Display */}
      <View style={styles.otpContainer}>
        {Array.from({ length: OTP_LENGTH }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.otpBox,
              code.length === index && styles.otpBoxActive,
              code.length > index && styles.otpBoxFilled,
              error && code.length === 0 && styles.otpBoxError,
            ]}
          >
            <Text style={[
              styles.otpText,
              code.length > index && styles.otpTextFilled,
            ]}>
              {code[index] || ''}
            </Text>
          </View>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading && (
        <ActivityIndicator
          size="small"
          color="#1DA1F2"
          style={styles.loader}
        />
      )}

      {/* Countdown */}
      <View style={styles.countdownContainer}>
        {!canResend ? (
          <Text style={styles.countdownText}>
            Resend code in <Text style={styles.countdownBold}>{formatCountdown()}</Text>
          </Text>
        ) : null}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="call-outline" size={18} color="#1DA1F2" />
          <Text style={styles.actionButtonText}>Wrong number?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, !canResend && styles.actionButtonDisabled]}
          onPress={handleResend}
          disabled={!canResend}
        >
          <Ionicons
            name="refresh-outline"
            size={18}
            color={canResend ? '#1DA1F2' : '#AAB8C2'}
          />
          <Text style={[
            styles.actionButtonText,
            !canResend && styles.actionButtonTextDisabled,
          ]}>
            Didn't receive code?
          </Text>
        </TouchableOpacity>
      </View>

      {/* Custom Numpad */}
      <View style={styles.numpadContainer}>
        {[
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
          ['empty', '0', 'delete'],
        ].map((row, rowIndex) => (
          <View key={rowIndex} style={styles.numpadRow}>
            {row.map((key) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.numpadKey,
                  key === 'empty' && styles.numpadKeyEmpty,
                ]}
                onPress={() => handleNumpadPress(key)}
                disabled={key === 'empty'}
                activeOpacity={key === 'empty' ? 1 : 0.6}
              >
                {key === 'delete' ? (
                  <Ionicons name="backspace-outline" size={28} color="#14171A" />
                ) : key === 'empty' ? null : (
                  <Text style={styles.numpadKeyText}>{key}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F7F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#14171A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#657786',
    lineHeight: 24,
  },
  phoneHighlight: {
    fontWeight: '700',
    color: '#14171A',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 10,
    marginBottom: 16,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E1E8ED',
    backgroundColor: '#F7F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxActive: {
    borderColor: '#1DA1F2',
    backgroundColor: '#FFFFFF',
  },
  otpBoxFilled: {
    borderColor: '#1DA1F2',
    backgroundColor: '#E8F5FE',
  },
  otpBoxError: {
    borderColor: '#E0245E',
  },
  otpText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#14171A',
  },
  otpTextFilled: {
    color: '#1DA1F2',
  },
  error: {
    color: '#E0245E',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 8,
    paddingHorizontal: 24,
  },
  loader: {
    marginVertical: 8,
  },
  countdownContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  countdownText: {
    fontSize: 14,
    color: '#657786',
  },
  countdownBold: {
    fontWeight: '700',
    color: '#1DA1F2',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1DA1F2',
  },
  actionButtonTextDisabled: {
    color: '#AAB8C2',
  },
  numpadContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  numpadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  numpadKey: {
    width: 80,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#F7F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numpadKeyEmpty: {
    backgroundColor: 'transparent',
  },
  numpadKeyText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#14171A',
  },
});
