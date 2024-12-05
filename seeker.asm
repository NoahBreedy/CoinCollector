; COIN COLLECTOR PLUS 
; Seek Nearest Coin 

.const MOVE 0xE000 ; w
.const ROTATE_LEFT 0xE001  ; w
.const ROTATE_RIGHT 0xE002 ; w
.const PLAYER_X 0xA000  ; r
.const PLAYER_Y 0xA001  ; r
.const PLAYER_DIRECTION 0xA002 ; r/w
.const NEAREST_COIN 0xA003  ; r
.const NEAREST_COIN_X 0xA004 ; r
.const NEAREST_COIN_Y 0xA005 ; r
.const NEAREST_ENEMY 0xA006 ; r
.const NEAREST_ENEMY_X 0xA007 ; r
.const NEAREST_ENEMY_Y 0xA008 ; r
.const COIN_COUNT 0xA009 ; r
.const RANDOM 0xA00A ; r 

!main 
    lod rA, [NEAREST_COIN] 
    lod rA, [NEAREST_COIN_X]
    lod rB, [PLAYER_X]
    jmp !go_to_x
    !end_x
    lod rA, [NEAREST_COIN_Y]
    jmp !go_to_y
    jmp !main 
        
!go_to_x
    lod rB, [PLAYER_X]
    cmp rB, rA
    jg !move_left  
    jl !move_right
    jmp !end_x

!go_to_y
    lod rB, [PLAYER_Y]
    cmp rB, rA
    jg !move_up  
    jl !move_down
    jmp !main

!move_left
    set rC, 1
    str [PLAYER_DIRECTION], rC
    str [MOVE], rZ
    jmp !go_to_x

!move_right
    set rC, 3
    str [PLAYER_DIRECTION], rC
    str [MOVE], rZ
    jmp !go_to_x

!move_down
    set rC, 0
    str [PLAYER_DIRECTION], rC
    str [MOVE], rZ
    jmp !go_to_y

!move_up
    set rC, 2
    str [PLAYER_DIRECTION], rC
    str [MOVE], rZ
    jmp !go_to_y

