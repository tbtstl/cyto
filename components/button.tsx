import * as React from 'react';
import styles from '../styles/button.module.css';

export function Button({ children, ...props }: { children: React.ReactNode }) {
    return <button {...props} className={styles.base}>{children}</button>
}
