import { ReactNode } from 'react'
import styles from '../styles/button.module.css'

export const FooterButtons = ({ children }: { children: ReactNode }) => {
    return (
        <div className={styles.footerContainer}>
            {children}
        </div>
    )
}
