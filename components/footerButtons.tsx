import styles from '../styles/button.module.css'

export const FooterButtons = ({ children }) => {
    return (
        <div className={styles.footerContainer}>
            {children}
        </div>
    )
}
