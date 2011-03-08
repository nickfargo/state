<?php
class Combiner {
	
	static function compile( $sourcePath, $outputPath ) {
		
	}
	
	static function getFiles( $rootPath ) {
		
	}
	
	static function getFilesInPath( $path, $extension ) {
		$order = array();
		$items = scandir( $path );
		$count = count( $items );
		$result = array();
		foreach ( $items as $item ) {
			$itemPath = $path . '/' . $item;
			if ( $item == '.compile' ) {
				$order = self::getCompileOrderForPath();
			} else if (
				(
					is_file( $itemPath )
						&&
					( !$extension  ||  self::endsWith( $itemPath, $extension ) )
						&&
					!( $item == ".htaccess"  ||  $item == ".htpasswd" )
				)
					||
				(  is_dir( $itemPath )  &&  !( $item == "."  ||  $item == ".."  ) )
			){
				$result[] = $item;
			}
		}
	}
	
	static function getCompileOrderForPath( $path ) {
		$order = array();
		$compile = trim( file_get_contents( $path, false ) );
		$orderSplit = ( strpos( $compile, "*" ) !== false ) ? explode( "*", $compile ) : array( $compile, '' );
		for( $j=0; $j < count( $orderSplit ); $j++ ) {
			$orderSplit[$j] = trim( $orderSplit[$j] );
			$order[$j] = ( strlen( $orderSplit[$j] ) ) ? explode( "\n", $orderSplit[$j] ) : array();
		}
		for( $j=0; $j < count( $order ); $j++ ) {
			for( $k=0; $k < count( $order[$j] ); $k++ ) {
				$order[$j][$k] = trim( $order[$j][$k] );
			}
		}
		return $order;
	}
	
	static function endsWith( $haystack, $needle ) {
		$hlen = strlen($haystack);
		$nlen = strlen($needle);
		return ( ( $hlen >= $nlen ) && ( substr( $haystack, $hlen - $nlen ) == $needle ) );
	}
	
}
?>