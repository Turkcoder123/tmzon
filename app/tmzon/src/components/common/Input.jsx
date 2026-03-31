import React, { forwardRef } from 'react';
import styles from './Input.module.css';

const Input = forwardRef(function Input({ label, error, textarea = false, ...props }, ref) {
  const Tag = textarea ? 'textarea' : 'input';
  return (
    <div className={styles.wrapper}>
      {label && <label className={styles.label}>{label}</label>}
      <Tag
        ref={ref}
        className={[styles.input, error ? styles.inputError : '', textarea ? styles.textarea : ''].join(' ')}
        {...props}
      />
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
});

export default Input;
