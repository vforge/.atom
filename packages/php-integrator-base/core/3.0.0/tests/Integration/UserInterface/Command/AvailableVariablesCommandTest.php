<?php

namespace PhpIntegrator\Tests\Integration\UserInterface\Command;

use PhpIntegrator\UserInterface\Command\AvailableVariablesCommand;

use PhpIntegrator\Tests\Integration\AbstractIntegrationTest;

class AvailableVariablesCommandTest extends AbstractIntegrationTest
{
    /**
     * @return void
     */
    public function testReturnsOnlyVariablesRelevantToTheGlobalScope(): void
    {
        $output = $this->getAvailableVariables('GlobalScope.phpt');

        $this->assertEquals([
            '$var3' => ['name' => '$var3', 'type' => null],
            '$var2' => ['name' => '$var2', 'type' => null],
            '$var1' => ['name' => '$var1', 'type' => null]
        ], $output);
    }

    /**
     * @return void
     */
    public function testReturnsOnlyVariablesRelevantToTheCurrentFunction(): void
    {
        $output = $this->getAvailableVariables('FunctionScope.phpt');

        $this->assertEquals([
            '$closure' => ['name' => '$closure', 'type' => null],
            '$param2'  => ['name' => '$param2',  'type' => null],
            '$param1'  => ['name' => '$param1',  'type' => null]
        ], $output);
    }

    /**
     * @return void
     */
    public function testReturnsOnlyVariablesRelevantToTheCurrentMethod(): void
    {
        $output = $this->getAvailableVariables('ClassMethodScope.phpt');

        $this->assertEquals([
            '$this'    => ['name' => '$this',    'type' => null],
            '$closure' => ['name' => '$closure', 'type' => null],
            '$param2'  => ['name' => '$param2',  'type' => null],
            '$param1'  => ['name' => '$param1',  'type' => null]
        ], $output);
    }

    /**
     * @return void
     */
    public function testReturnsOnlyVariablesRelevantToTheCurrentClosure(): void
    {
        $output = $this->getAvailableVariables('ClosureScope.phpt');

        $this->assertEquals([
            '$this'         => ['name' => '$this',         'type' => null],
            '$test'         => ['name' => '$test',         'type' => null],
            '$something'    => ['name' => '$something',    'type' => null],
            '$closureParam' => ['name' => '$closureParam', 'type' => null]
        ], $output);
    }

    /**
     * @return void
     */
    public function testCorrectlyIgnoresVariousStatements(): void
    {
        $file = 'VariousStatements.phpt';
        $fullPath = $this->getTestFilePath($file);

        $command = $this->getCommand($file);

        $i = 1;
        $markerOffsets = [];

        while (true) {
            $markerOffset = $this->getMarkerOffset($fullPath, "MARKER_{$i}");

            if ($markerOffset === null) {
                break;
            }

            $markerOffsets[$i++] = $markerOffset;
        }

        $doMarkerTest = function ($markerNumber, array $variableNames) use ($command, $fullPath, $markerOffsets) {
            $list = [];

            foreach ($variableNames as $variableName) {
                $list[$variableName] = ['name' => $variableName, 'type' => null];
            }

            $this->assertEquals(
                $list,
                $command->getAvailableVariables(file_get_contents($fullPath), $markerOffsets[$markerNumber])
            );
        };

        $doMarkerTest(1, []);
        $doMarkerTest(2, ['$a']);
        $doMarkerTest(3, []);
        $doMarkerTest(4, ['$b']);
        $doMarkerTest(5, []);
        $doMarkerTest(6, ['$b2']);
        $doMarkerTest(7, []);
        $doMarkerTest(8, ['$c']);
        $doMarkerTest(9, []);
        $doMarkerTest(10, ['$d']);
        $doMarkerTest(11, ['$key', '$value']);
        $doMarkerTest(12, ['$key', '$value', '$e']);
        $doMarkerTest(13, ['$i']);
        $doMarkerTest(14, ['$i', '$f']);
        $doMarkerTest(15, []);
        $doMarkerTest(16, ['$g']);
        $doMarkerTest(17, []);
        $doMarkerTest(18, ['$h']);
        $doMarkerTest(19, []);
        $doMarkerTest(20, ['$i']);
        $doMarkerTest(21, []);
        $doMarkerTest(22, ['$j']);
        $doMarkerTest(23, []);
        $doMarkerTest(24, ['$k']);
        $doMarkerTest(25, ['$e']);
        $doMarkerTest(26, ['$l', '$e']);
        $doMarkerTest(27, ['$e']);
        $doMarkerTest(28, ['$m', '$e']);
        // $doMarkerTest(29, []); // TODO: Can't be solved for now, see also the implementation code.
        $doMarkerTest(30, ['$n']);
    }

    /**
     * @param string $file
     * @param bool   $mayFail
     *
     * @return AvailableVariablesCommand
     */
    protected function getCommand(string $file, bool $mayFail = false): AvailableVariablesCommand
    {
        $path = $this->getTestFilePath($file);

        $this->indexTestFile($this->container, $path, $mayFail);

        return $this->container->get('availableVariablesCommand');
    }

    /**
     * @param string $name
     *
     * @return string
     */
    protected function getTestFilePath(string $name): string
    {
        return __DIR__ . '/AvailableVariablesCommandTest/' . $name;
    }

    /**
     * @param string $file
     * @param bool   $mayIndexingFail
     *
     * @return array
     */
    protected function getAvailableVariables(string $file, bool $mayIndexingFail = false): array
    {
        $command = $this->getCommand($file, $mayIndexingFail);

        $path = $this->getTestFilePath($file);

        $markerOffset = $this->getMarkerOffset($path, '<MARKER>');

        return $command->getAvailableVariables(file_get_contents($path), $markerOffset);
    }

    /**
     * @param string $path
     * @param string $marker
     *
     * @return int|null
     */
    protected function getMarkerOffset(string $path, string $marker): ?int
    {
        $testFileContents = file_get_contents($path);

        $markerOffset = mb_strpos($testFileContents, $marker);

        return $markerOffset !== false ? $markerOffset : null;
    }
}
