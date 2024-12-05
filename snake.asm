; COIN COLLECTOR PLUS 
; sssssnake bot 

.const MOVE 0xE000 ; w
.const ROTATE_LEFT 0xE001  ; w
.const ROTATE_RIGHT 0xE002 ; w
.const PLAYER_X 0xA000  ; r
.const PLAYER_Y 0xA001  ; r
.const PLAYER_DIRECTION 0xA002 ; r
.const NEAREST_COIN 0xA003  ; r
.const NEAREST_COIN_X 0xA004 ; r
.const NEAREST_COIN_Y 0xA005 ; r
.const NEAREST_ENEMY 0xA006 ; r
.const NEAREST_ENEMY_X 0xA007 ; r
.const NEAREST_ENEMY_Y 0xA008 ; r
.const COIN_COUNT 0xA009 ; r
.const RANDOM 0xA00A ; r 

set rA, 0
!main 
    str [MOVE], rZ ; Move Forwards 
    inc rA 
    cmp rA, 13 
    je  !snake_move 
    jmp !main 


!main_2
    str [MOVE], rZ ; Move Forwards 
    inc rA 
    cmp rA, 13 
    je  !snake_move_2 
    jmp !main_2 


!snake_move 
    set rA, 0 
    str [ROTATE_RIGHT], rZ ; Rotate Right
    str [MOVE], rZ
    str [ROTATE_RIGHT], rZ ; Rotate Left
    jmp !main_2

!snake_move_2 
    set rA, 0 
    str [ROTATE_LEFT], rZ ; Rotate Right
    str [MOVE], rZ
    str [ROTATE_LEFT], rZ ; Rotate Left
    jmp !main