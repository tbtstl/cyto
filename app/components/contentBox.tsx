'use client'

import * as React from 'react';
import { Button } from './button';
import styles from '../styles/contentBox.module.css';


export interface ButtonProps {
    onClick: () => void;
    content: string;
}

export function ContentBox({ children, center, buttons }: { children: React.ReactNode, center?: boolean, buttons?: ButtonProps[] }) {
    return (
        <div className={`${styles.container} ${center && styles.center}`}>
            <div className={styles.box}>
                {children}
            </div>
            <div className={styles.buttonContainer}>
                {buttons?.map((button, i) => (
                    <Button key={i} onClick={button.onClick}>{button.content}</Button>
                ))}
            </div>
        </div>
    )
}

