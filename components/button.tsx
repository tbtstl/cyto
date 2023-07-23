import * as React from 'react';
import styles from '../styles/button.module.css';

export function Button({ children, theme, ...props }: { children: React.ReactNode, theme?: 'blue' | 'red', onClick: () => void }) {
    return <button {...props} className={`${styles.base} ${styles[theme || '']}`}>{children}</button>
}
