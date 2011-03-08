<?php
class JSCompiler {
	
	protected $rootPath;
	protected $paths;
	protected $filePaths;
	protected $dirPaths;
	protected $startingDir;
	protected $outputFileName;
	protected $srcSubDir;
	protected $extension;
	protected $sourcePath;
	protected $sanity;
	
	function __construct( $rootPath, $outputFileName, $srcSubDir = "src", $extension = ".js" ) {
		$this->startingDir = $baseDir;
		$this->outputFileName = $outputFileName . $extension;
		$this->srcSubDir = $srcSubDir;
		$this->extension = $extension;
		$this->sourcePath = $baseDir . "/" . $srcSubDir;
	}
	
	function convertToExternalPath( $internalPath ) {
		$internalPath = str_replace( "\\", "/", $internalPath );
		if( strpos( $internalPath, str_replace( "\\", "/", $this->internalDomainRoot ) ) === false )
			return null;
		return "http://" . $this->domain . substr( $internalPath, strlen( $this->internalDomainRoot ) );
	}
	
	function getFiles() {
		unset( $this->dirPaths, $this->filePaths, $this->namespaces );
		$x = $this->getFilesInternal( $this->sourcePath, $this->extension );
		return $this->filePaths;
	}
	
	protected function getFilesInternal( $dir, $extension ) {
	
		$this->sanity++;
		
		$files = array();
		$dirs = array();
		$order = array();
		$orderSplit = array();
		$scan = scandir( $dir );
		$items = array();
		
		for( $i=0; $i < count($scan); $i++ ) {
			$path = $dir . "/" . $scan[$i];
			if( $scan[$i] == ".compile" ) {
				$compile = trim( file_get_contents( $path, false ) );
				$orderSplit = ( strpos( $compile, "*" ) !== false ) ? explode( "*", $compile ) : array( $compile, '' );
				for( $j=0; $j < count( $orderSplit ); $j++ ) {
					$orderSplit[$j] = trim( $orderSplit[$j] );
					$order[$j] = ( strlen( $orderSplit[$j] ) ) ? explode( "\n", $orderSplit[$j] ) : array();
				}
				for( $j=0; $j < count( $order ); $j++ )
					for( $k=0; $k < count( $order[$j] ); $k++ )
						$order[$j][$k] = trim( $order[$j][$k] );
			} else if(
				is_file( $path )
					&&
				(
					$extension == null
						||
					self::endsWith( $path, $extension )
				)
					&&
				!(
					$scan[$i] == ".htaccess"
						||
					$scan[$i] == ".htpasswd"
				)
			) {
				$items[] = $scan[$i];
			} else if(
				is_dir( $path )
					&&
				!(
					$scan[$i] == "."
						||
					$scan[$i] == ".."
				)
			) {
				$items[] = $scan[$i];
			}
		}
		
		// rearrange elements according to $order
		$endItems = array();
		for( $i=0; $i < count( $order ); $i++ ) {
			$endItems[$i] = array();
			for( $j=0; $j < count($order[$i]); $j++ ) {
				$o = $order[$i][$j];
				$path = $dir . "/" . $o;
				if( is_file( $path . $extension ) )
					$endItems[$i][$j] = $o . $extension;
				else if( is_dir( $path ) )
					$endItems[$i][$j] = $o;
			}
		}
		$middleItems = array();
		$middleFiles = array();
		$middleDirs = array();
		for( $i=0; $i < count($items); $i++ ) {
			$found = false;
			for( $j=0; $j < count( $order ); $j++ ) {
				for( $k=0; $k < count($order[$j]); $k++ )
					if( $items[$i] == $order[$j][$k] || $items[$i] == ( $order[$j][$k] . $extension ) ) {
						$found = true;
						break;
					}
				if( $found )
					break;
			}
			if( !$found ) {
				$path = $dir . "/" . $items[$i];
				if( is_file( $path ) )
					$middleFiles[] = $items[$i];
				else if( is_dir( $path ) )
					$middleDirs[] = $items[$i];
			}
		}
		$middleItems = array_merge( $middleFiles, $middleDirs );
		unset( $items );
		$items = array();
		if( count( $endItems[0] ) )
			$items = array_merge( $items, $endItems[0] );
		if( count( $middleItems ) )
			$items = array_merge( $items, $middleItems );
		if( count( $endItems[1] ) )
			$items = array_merge( $items, $endItems[1] );
		
		// add items to class vars
		for( $i=0; $i < count($items); $i++ ) {
			$path = $dir . "/" . $items[$i];
			if( is_file( $path ) ) {
				if( $extension == null || self::endsWith( $path, $extension ) ) {
					$this->filePaths[] = $path;
					$result[] = $items[$i];
				}
			} else if( is_dir( $path ) ) {
				$this->dirPaths[] = $path;
				$namespace = str_replace( "/", ".", substr( $path, strlen( $this->sourcePath ) + 1 ) );
				$this->namespaces[] = $namespace;
				$this->getFilesInternal( $path, $extension );
			}
		}
		$this->sanity--;
		return $result;
	}
	
	static function endsWith( $haystack, $needle ) {
		$hlen = strlen($haystack);
		$nlen = strlen($needle);
		return ( ( $hlen >= $nlen ) && ( substr( $haystack, $hlen - $nlen ) == $needle ) );
	}
	
	function compile( $outputFilePath = "", $compress = false, $linkphp ) {
		if( !$outputFilePath )
			$outputFilePath = $this->startingDir . "/" . $this->outputFileName;
		$this->getFiles();
		file_put_contents( $outputFilePath, $namespaceCode, FILE_APPEND | LOCK_EX );
		for( $i=0; $i < count($this->filePaths); $i++ ) {
			$path = $this->filePaths[$i];
			echo $path . "<br/>";
			$relativePath = ( strpos( $path, $this->startingDir ) === false ) ? $path : substr( $path, strlen( $this->startingDir ) + 1 );
			$header = "/" . str_repeat("*", 79) . "\n * " . $relativePath . "\n " . str_repeat("*", 78) . "/\n";
			$contents = $header . file_get_contents( $path, false ) . "\n\n";
			file_put_contents( $outputFilePath, $contents, FILE_APPEND | LOCK_EX );
		}
		if( $compress ) {
			require_once "jsmin-1.1.1.php";
			$compressed = JSMin::minify( file_get_contents( $outputFilePath ) );
			file_put_contents( $outputFilePath, $compressed, LOCK_EX );
			clearstatcache();
		}
		return $out;
	}
	
	function readFileToString( $filePath ) {
		if( !file_exists( $filePath ) )
			return;
		$handle = fopen( $filePath, "rt" );
		$contents = stream_get_contents( $handle );
		fclose( $handle );
		return $contents;
	}
	
	function generateNamespaceCode( $namespaces ) {
		$result = "/** Namespace Objects */\n\n";
		for( $i=0; $i<count($namespaces); $i++ )
			if( $namespaces[$i] )
				$result .= $namespaces[$i] . " = {};\n";
		$result .= "\n\n";
		return $result;
	}
}