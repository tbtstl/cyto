import * as React from 'react';
import { Button } from './button';
import styles from '../styles/contentBox.module.css';


export function ContentBox({ children }: { children: React.ReactNode }) {
    return (
        <div className={styles.container}>
            <div className={styles.box}>
                {children}
            </div>
        </div>
    )
}

