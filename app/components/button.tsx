import * as React from 'react';
import styles from '../styles/button.module.css';

export async function Button({ children, ...props }: { children: React.ReactNode, handler: () => void }) {
    return <button {...props} onClick={props.handler} className={styles.base}>{children}</button>;
}
