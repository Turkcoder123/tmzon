import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function OtpVerificationScreen({ navigation, route }) {
  const { phone } = route.params || {};
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    startCountdown();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startCountdown() {
    setCountdown(60);
    setCanResend(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function handleResend() {
    if (!canResend) return;
    startCountdown();
  }

  function handleNumberPress(num) {
    if (otp.length < 6) {
      setOtp((prev) => prev + num);
      setError('');
    }
  }

  function handleBackspace() {
    setOtp((prev) => prev.slice(0, -1));
    setError('');
  }

  async function handleVerify() {
    if (otp.length < 6) {
      setError('Please enter the complete code');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // OTP verification will be integrated with backend
      navigation.navigate('Login');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function maskedPhone() {
    if (!phone) return '***';
    if (phone.length > 4) {
      return phone.slice(0, -4).replace(/./g, '*') + phone.slice(-4);
    }
    return phone;
  }

  function renderOtpBoxes() {
    const boxes = [];
    for (let i = 0; i < 6; i++) {
      const isFilled = i < otp.length;
      const isActive = i === otp.length;
      boxes.push(
        <View
          key={i}
          style={[
            styles.otpBox,
            isFilled && styles.otpBoxFilled,
            isActive && styles.otpBoxActive,
          ]}
        >
          <Text style={[styles.otpText, isFilled && styles.otpTextFilled]}>
            {otp[i] || ''}
          </Text>
        </View>
      );
    }
    return boxes;
  }

  const numpadKeys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'back'],
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#14171A" />
        </TouchableOpacity>

        {/* Title section */}
        <Text style={styles.title}>Verify Code</Text>
        <Text style={styles.subtitle}>
          We sent a verification code to{'\n'}
          <Text style={styles.phoneText}>{maskedPhone()}</Text>
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* OTP Input boxes */}
        <View style={styles.otpContainer}>{renderOtpBoxes()}</View>

        {/* Auto-verify on 6 digits */}
        {otp.length === 6 && (
          <TouchableOpacity
            style={[styles.verifyButton, loading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.verifyButtonText}>Verify</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Countdown */}
        <View style={styles.countdownContainer}>
          {!canResend ? (
            <Text style={styles.countdownText}>
              Resend code in <Text style={styles.countdownBold}>{formatTime(countdown)}</Text>
            </Text>
          ) : null}
        </View>

        {/* Action links */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.actionLink}>Wrong number?</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleResend} disabled={!canResend}>
            <Text style={[styles.actionLink, !canResend && styles.actionDisabled]}>
              Didn't receive code?
            </Text>
          </TouchableOpacity>
        </View>

        {/* Custom Numpad */}
        <View style={styles.numpad}>
          {numpadKeys.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.numpadRow}>
              {row.map((key, keyIndex) => {
                if (key === '') {
                  return <View key={keyIndex} style={styles.numpadKeyEmpty} />;
                }
                if (key === 'back') {
                  return (
                    <TouchableOpacity
                      key={keyIndex}
                      style={styles.numpadKey}
                      onPress={handleBackspace}
                    >
                      <Ionicons name="backspace-outline" size={26} color="#14171A" />
                    </TouchableOpacity>
                  );
                }
                return (
                  <TouchableOpacity
                    key={keyIndex}
                    style={styles.numpadKey}
                    onPress={() => handleNumberPress(key)}
                  >
                    <Text style={styles.numpadKeyText}>{key}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F7F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#14171A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#657786',
    lineHeight: 22,
    marginBottom: 8,
  },
  phoneText: {
    fontWeight: '600',
    color: '#14171A',
  },
  error: {
    color: '#E0245E',
    fontSize: 14,
    marginTop: 8,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 28,
    marginBottom: 16,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E1E8ED',
    backgroundColor: '#F7F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFilled: {
    borderColor: '#1DA1F2',
    backgroundColor: '#E8F5FD',
  },
  otpBoxActive: {
    borderColor: '#1DA1F2',
    borderWidth: 2,
  },
  otpText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#E1E8ED',
  },
  otpTextFilled: {
    color: '#1DA1F2',
  },
  verifyButton: {
    backgroundColor: '#1DA1F2',
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  countdownContainer: {
    alignItems: 'center',
    marginTop: 16,
    minHeight: 22,
  },
  countdownText: {
    fontSize: 14,
    color: '#657786',
  },
  countdownBold: {
    fontWeight: '700',
    color: '#1DA1F2',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 8,
  },
  actionLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1DA1F2',
  },
  actionDisabled: {
    color: '#AAB8C2',
  },
  numpad: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 12,
  },
  numpadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  numpadKey: {
    width: 75,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
  },
  numpadKeyEmpty: {
    width: 75,
    height: 60,
    margin: 4,
  },
  numpadKeyText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#14171A',
  },
});
