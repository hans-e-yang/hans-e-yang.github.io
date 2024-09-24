interface Game<State, Action, Player> {
  startState(): State
  isEnd(state: State): boolean
  actions(state: State): Action[]
  succ(state: State, action: Action): State
  utility(state: State): number
  
  currentPlayer(state: State): Player
}

interface Player<S, A, P> {
  getMove(state: S, game: Game<S, A, P>): A
}

interface GameSession<State, Action, Player> {
  currentState: State
  game: Game<State, Action, Player>
  player: Player[]
  nextMove(): void
}

type ChessPosition = { row: number, column: number}
// Lower case for white pieces and upper case for black pieces
type ChessPiece = 'r' | 'n' | 'b' | 'q' | 'k' | 'p' | 
                  'R' | 'N' | 'B' | 'Q' | 'K' | 'P' | null;
type ChessRow = ChessPiece[] & { length: 8 }

type ChessState = {
  board: ChessRow[] & { length: 8 }
  blackCanCastleKingSide: boolean
  blackCanCastleQueenSide: boolean
  whiteCanCastleKingSide: boolean
  whiteCanCastleQueenSide: boolean
  isWhiteTurn: boolean
  enPassant: ChessPosition | null
}

type ChessMove = {
  from: ChessPosition
  to: ChessPosition
  piece: ChessPiece
  capturedPiece?: ChessPiece
  isCastling?: boolean
  isEnPassant?: boolean
  promotionPiece?: ChessPiece
}

// True for white, false for black
type ChessPlayer = boolean

class ChessGame implements Game<ChessState, ChessMove, ChessPlayer> {
  startState() : ChessState {
    return {
      board: [
        ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'], 
        ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'], 
        [null, null, null, null, null, null, null, null], 
        [null, null, null, null, null, null, null, null], 
        [null, null, null, null, null, null, null, null], 
        [null, null, null, null, null, null, null, null], 
        ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'], 
        ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']  
      ],
      isWhiteTurn: true,
      blackCanCastleKingSide: true,
      blackCanCastleQueenSide: true,
      whiteCanCastleKingSide: true,
      whiteCanCastleQueenSide: true,
      enPassant: null,
    }
  } 

  isEnd(s: ChessState) {
    return this.actions(s).length == 0
  }

  actions(s: ChessState): ChessMove[] {
    let moves = []
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        let piece = s.board[row][col]
        if (piece == null) continue;
        let isWhite = piece >= 'a' && piece <= 'z'

        if (isWhite == s.isWhiteTurn)
          moves.push(...this.getMoves(s, piece, row, col))
      }
    }
    return moves
  }


  // from: ChessPosition
  // to: ChessPosition
  // piece: ChessPiece
  // capturedPiece?: ChessPiece
  // isCastling?: boolean
  // isEnPassant?: boolean
  // promotionPiece?: ChessPiece

  getMoves(state: ChessState, piece: ChessPiece, row: number, col: number) {
    if (piece == null)
      return []

    let moves : ChessMove[] = []
    let isWhite = piece >= 'a' && piece <= 'z'

    function genMove(toRow: number, toCol: number) {
      return {
        from: {row, col},
        to: {row: toRow, col: toCol},
        piece: piece,
      }
    }

    // Start from pawn, start with basic movements

    function getRookMoves() {
      // Check up
      for (let r = row; r < 8; r++) {
        let currentPiece = state.board[r][col]
        if (currentPiece == null) {
          moves
        }
      }
    }


    switch (piece.toLowerCase()) {
      case "r":
      case "n":
      case "b":
      case "q":
      case "k":
      case "p":
    }

    return moves
  }


  succ(state: ChessState, action: ChessMove): ChessState {
    return {
      ...state,
      // This will definitely work
      //@ts-ignore
      board: state.board.map(x => [...x]),
    }
  }

  // Here white is always first player, while black is second
  // Black calculates utility by having -utility(state)
  // As chess is a zero sum game
  utility(state: ChessState): number {
    let blackKingExist = false
    let whiteKingExist = false
    for (const row of state.board) {
      for (const cell of row) {
        if (cell == 'k') whiteKingExist = true
        if (cell == 'K') blackKingExist = true
        if (blackKingExist && whiteKingExist) return 0
      }
    }

    if (blackKingExist) return -Infinity
    else return Infinity
  }

  currentPlayer(s: ChessState) {
    return s.isWhiteTurn
  }
}
