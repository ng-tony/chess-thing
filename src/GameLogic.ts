const BOARD_SIZE = 8

export enum Color {
    white = 'White',
    black = 'Black',
}

export enum PieceType {
    Bishop = 'Bishop',
    King = 'King',
    Knight = 'Knight',
    Pawn = 'Pawn',
    Queen = 'Queen',
    Rook = 'Rook',
    Blank = 'Blank',
}

export default interface PieceData {
    color: Color
    type: PieceType
    haveMoved: boolean
    letters: string
    powerUps: PowerUpData[]
}

export enum PowerUpType {
    Guard = "Guard",
    Shield = "Shield",
    Sword = "Sword",
    Flail = "Flail",
}

export interface PowerUpData {
    type: PowerUpType,
}

export const decodePiece = (letters: string): PieceData => {
    return {
        color: letters[0] === 'w' ? Color.white : Color.black,
        type: decodePieceType(letters),
        haveMoved: false,
        letters,
        powerUps: [],
    }
}

export const validateMove = (
    from: number,
    to: number,
    squares: (PieceData | null)[]
): boolean => {
    return getMoves(from, squares).includes(to)
}

const decodePieceType = (letters: string): PieceType => {
    switch (letters[1]) {
        case 'b':
            return PieceType.Bishop
        case 'k':
            return PieceType.King
        case 'n':
            return PieceType.Knight
        case 'p':
            return PieceType.Pawn
        case 'q':
            return PieceType.Queen
        case 'r':
            return PieceType.Rook
        default:
            return PieceType.Blank
    }
}

const getMoves = (loc: number, squares: (PieceData | null)[]): number[] => {
    if (squares[loc] === null) return []
    return pieceMoveStrategies[squares[loc]!.type](loc, squares)
}

const getCaptureMoves = (loc: number, squares: (PieceData | null)[]): number[] => {
    if (squares[loc] === null) return []
    return pieceCaptureOnlyStrategies[squares[loc]!.type](loc, squares)
}

const filterInvalidMoves = (
    potentialMoves: number[],
    loc: number,
    squares: (PieceData | null)[]
) => {
    return potentialMoves.filter((i: number) => {
        return (
            i >= 0 &&
            i <= 63 &&
            (squares[i]?.color !== squares[loc]?.color)
        )
    })
}

const checkCheck = (color: Color, squares: (PieceData | null)[]): boolean => {
    for (const [i, square] of squares.entries()) {
        if (!square || square!.color === color) continue
        const checks = getCaptureMoves(i, squares).filter((move) => {
            return (
                squares[move]?.color === color &&
                squares[move]?.type === PieceType.King
            )
        })
        if (checks.length > 0) return true
    }
    return false
}

const bishopMoves = (loc: number, squares: (PieceData | null)[]): number[] => {
    let potential_moves = []
    //Move in the four diagonal directions
    const operations = [
        (n: number) => loc + n * 9,
        (n: number) => loc + n * -9,
        (n: number) => loc + n * 7,
        (n: number) => loc + n * -7,
    ]
    for (let op of operations) {
        for (let i = 1; i < BOARD_SIZE; i++) {
            potential_moves.push(op(i))
            if (squares[op(i)]) break
        }
    }
    return filterInvalidMoves(potential_moves, loc, squares)
}

//Need to implement Castling
const kingMoves = (loc: number, squares: (PieceData | null)[]): number[] => {
    let potentialMoves = [-9, -8, -7, -1, 1, 7, 8, 9].map((a) => a + loc)
    potentialMoves = filterInvalidMoves(potentialMoves, loc, squares)
    if (squares[loc]?.type !== PieceType.King) return []
    potentialMoves = potentialMoves.filter((move) => {
        let newSquares = [...squares]
        newSquares[move] = newSquares[loc]
        newSquares[loc] = null
        return !checkCheck(squares[loc]!.color, newSquares)
    })
    return potentialMoves
}

const knightMoves = (loc: number, squares: (PieceData | null)[]): number[] => {
    let potential_moves = [10, 17, 6, 15, -10, -17, -6, -15].map((n) => n + loc)
    return filterInvalidMoves(potential_moves, loc, squares)
}

const pawnMoves = (loc: number, squares: (PieceData | null)[]): number[] => {
    let potential_moves = []
    let [op, startingPos] =
        squares[loc]?.color === Color.white
            ? [(b: number) => loc + b, Math.floor(loc / 8) === 1]
            : [(b: number) => loc - b, Math.floor(loc / 8) === 6]

    //Normal Move
    potential_moves.push(op(8))

    //Double Move
    if (startingPos) {
        potential_moves.push(op(16))
    }
    const moves = filterInvalidMoves(potential_moves, loc, squares)
    return moves.concat(pawnAttackMoves(loc, squares))
}

const queenMoves = (loc: number, squares: (PieceData | null)[]): number[] => {
    let potential_moves = []
    const operations = [
        (n: number) => loc + n * 9,
        (n: number) => loc + n * -9,
        (n: number) => loc + n * 7,
        (n: number) => loc + n * -7,
        (n: number) => loc + n * 8,
        (n: number) => loc + n * -8,
        (n: number) => loc + n * 1,
        (n: number) => loc + n * -1,
    ]
    for (const op of operations) {
        for (let i = 1; i < BOARD_SIZE; i++) {
            potential_moves.push(op(i))
            if (squares[op(i)]) break
        }
    }
    return filterInvalidMoves(potential_moves, loc, squares)
}

const rookMoves = (loc: number, squares: (PieceData | null)[]): number[] => {
    let potential_moves = []
    const operations = [
        (n: number) => loc + n * 8,
        (n: number) => loc + n * -8,
        (n: number) => loc + n * 1,
        (n: number) => loc + n * -1,
    ]
    for (let op of operations) {
        for (let i = 1; i < BOARD_SIZE; i++) {
            potential_moves.push(op(i))
            if (squares[op(i)]) break
        }
    }
    return filterInvalidMoves(potential_moves, loc, squares)
}

const pawnAttackMoves = (loc: number, squares: (PieceData | null)[]): number[] => {
    let op =
        squares[loc]?.color === Color.white
            ? (b: number) => loc + b
            : (b: number) => loc - b
    return filterInvalidMoves([op(7), op(9)], loc, squares).filter(move => 
        squares[move] !== null
    )
}

//King attack moves used, as King moves checks for checks,
//i.e in the case that a King walks into another king's "zone", King moves will
//not capture it
const kingAttackMoves = (loc: number, squares: (PieceData | null)[]): number[] => {
    return filterInvalidMoves(
        [-9, -8, -7, -1, 1, 7, 8, 9].map((a) => a + loc),
        loc,
        squares
    )
}


const filterCaptureMoves = (
    moveStrategy: (loc: number, squares: (PieceData | null)[]) => number[]
) => {
    return (loc: number, squares: (PieceData | null)[]) => {
        return moveStrategy(loc, squares).filter((move: number) => {
            return squares[move] &&
                    squares[move]?.color !== squares[loc]?.color;
        });
    }
}

const shieldStrategy = (loc: number, squares: (PieceData | null)[], move: number): boolean => {
    if(squares[move] &&
        squares[move]!.powerUps.length > 0 &&
        squares[move]?.powerUps.reduce( (acc, powerUp) => {
            return acc || powerUp.type === PowerUpType.Shield
        })) {
        return false;
    }
    return true;
}



const defenderStrategies:(
    (loc:number, squares: (PieceData | null)[], move:number) => boolean)[] = [
        shieldStrategy,
    ];

const attackedStrategies:(
    (loc:number, squares: (PieceData | null)[], move:number) => boolean)[] = [

    ];

const filterWithStrategies =(
    strat: (loc: number, squares: (PieceData | null)[]) => number[],
    filteringStrats:  ((loc:number, squares: (PieceData | null)[], move: number) => boolean)[]):
    (loc: number, squares: (PieceData | null)[]) => number[] => {
        return (loc: number, squares: (PieceData | null)[]): number[] => {
            return strat(loc, squares).filter((move) => {
                return filteringStrats.every((fStrat) => {
                    return fStrat(loc, squares, move);
                })
            });
        };
}



const pieceMoveStrategies = {
    [PieceType.Bishop]: filterWithStrategies(bishopMoves, defenderStrategies),
    [PieceType.King]: filterWithStrategies(kingMoves, defenderStrategies),
    [PieceType.Knight]: filterWithStrategies(knightMoves, defenderStrategies),
    [PieceType.Pawn]: filterWithStrategies(pawnMoves, defenderStrategies),
    [PieceType.Queen]: filterWithStrategies(queenMoves, defenderStrategies),
    [PieceType.Rook]: filterWithStrategies(rookMoves, defenderStrategies),
    [PieceType.Blank]: () => [],
}

const pieceCaptureOnlyStrategies = {
    [PieceType.Bishop]: filterCaptureMoves(pieceMoveStrategies[PieceType.Bishop]),
    [PieceType.King]: kingAttackMoves,
    [PieceType.Knight]: filterCaptureMoves(pieceMoveStrategies[PieceType.Knight]),
    [PieceType.Pawn]: pawnAttackMoves,
    [PieceType.Queen]: filterCaptureMoves(pieceMoveStrategies[PieceType.Queen]),
    [PieceType.Rook]: filterCaptureMoves(pieceMoveStrategies[PieceType.Rook]),
    [PieceType.Blank]: () => [],
}