function doAs ( behavior ) {
    return state.bind( function () {
        this.mutate( behavior );
    });
}
