import * as React from 'react';
import styles from '../styles/game.module.css';
import { useCallback } from 'react';
import { GRID_SIZE } from '../constants/utils';

export function GameBoard({ grid }: { grid: number[][] }) {

    console.log({ grid })

    const onCellClick = useCallback(() => { }, [])

    return (
        <div className={styles.gameCanvas}>
            {[...Array(GRID_SIZE)].map((_, x) =>
                [...Array(GRID_SIZE)].map((_, y) => <Cell key={`${x}-${y}`} x={x} y={y} value={grid[x][y]} cb={onCellClick} />)
            )}
        </div>
    )
}

function Cell({ x, y, value, cb }: { x: number, y: number, value: number, cb: (x: number, y: number) => void }) {
    return (
        <div onClick={() => value ?? cb(x, y)} />
    )
}
