<?php

require __DIR__ . '/../system/autoload.php';

use Symfony\Component\DomCrawler\Crawler;

class API
{

    public function __construct()
    {
        $method = $_GET;
        if (isset($method['getUpdate'])) {
            $this->getUpdate();
        } elseif (isset($method['getUpdateItem']) and !empty($method['getUpdateItem'])) {
            $this->getUpdateItem($method['getUpdateItem']);
        } elseif (isset($method['getItems'])) {
            $this->getItems();
        } elseif (isset($method['getItem']) and !empty($method['getItem'])) {
            $this->getItem($method['getItem']);
        } else {
            $this->notFound();
        }
    }

    public function getUpdate()
    {
        $success = false;
        $config = require_once '../system/data/app.php';
        $mysqli = new mysqli($config['dbhost'], $config['dbuser'], $config['dbpass'], $config['dbname']);
        $url = 'https://www.avito.ru/rossiya/avtomobili/s_probegom?i=1&pmin=1&user=1&f=1375_15486b15581';
        $crawler = new Crawler();
        $crawler->addHtmlContent(file_get_contents($url));

        if ($mysqli->connect_error)
            die($mysqli->connect_errno . ' ' . $mysqli->connect_error);

        $cars = $crawler->filter('div.item')->each(function ($node) {
            return [
                'title' => $node->filter('h3 a')->text(),
                'image' => $node->filter('img')->attr('src'),
                'about' => $node->filter('.about')->text(),
                'link' => $node->filter('h3 a')->attr('href')
            ];
        });

        $end = count($cars);
        for ($i = 0; $i < $end; $i++) {
            $image = str_replace('140x105', '640x480', $cars[$i]['image']);
            $title = explode(', ', $this->full_trim($cars[$i]['title']));
            $name = $title[0];
            $year = $title[1];
            $about = explode('. ', $cars[$i]['about']);
            $price = $this->full_trim($about[0] . '.');
            $info = explode(', ', $about[1]);
            $link = $cars[$i]['link'];

            if ($this->full_trim($info[0]) == 'Битый') {
                $broken = $this->full_trim($info[0]);
                $mileage = $this->full_trim($info[1]);
                $engine = $info[2];
                $body = $info[3];
                $drive = $info[4];
                $fuel = $this->full_trim($info[5]);
            } else {
                $broken = 'Не битый';
                $mileage = $this->full_trim($info[0]);
                $engine = $info[1];
                $body = $info[2];
                $drive = $info[3];
                $fuel = $this->full_trim($info[4]);
            }

            $insert = "INSERT INTO cars(link,title,year,photos,price,broken,mileage,engine,body,drive,fuel,created_at) VALUES('$link','$name','$year','$image','$price','$broken','$mileage','$engine','$body','$drive','$fuel',NOW())";

            if ($mysqli->query($insert) === TRUE) {
                $mysqli->query('DELETE FROM cars WHERE created_at < NOW() - interval 15 minute AND purchased = 0');
                $success = true;
            } else {
                //echo "Error: " . $insert . "<br>" . $mysqli->error;
                die(json_encode(['error' => 'MySQL error']));
            }

        }

        if($success == true){
            echo json_encode(['success' => 'Database update']);
        }
    }

    public function getUpdateItem($link)
    {
        $url = 'https://m.avito.ru' . $link;
        $crawler = new Crawler();
        $crawler->addHtmlContent(file_get_contents($url));

        $config = require_once '../system/data/app.php';
        $mysqli = new mysqli($config['dbhost'], $config['dbuser'], $config['dbpass'], $config['dbname']);

        if ($car['title'] = $crawler->filter('header.single-item-header')->count() !== 0) {
            $car['photo'] = json_decode($crawler->filter('script#itemPhotogalleryData')->text(), true)['photos'];
            $car['desc'] = $crawler->filter('div.description-preview-wrapper > p')->text();
            $car['seller'] = $crawler->filter('div.person-name')->text();
            $car['info'] = $crawler->filter('section.single-item-description-params > .single-item-description-param')->each(function ($info) {
                return [
                    $info->filter('ul.description-param-values')->text()
                ];
            });

            $seller = $this->full_trim($car['seller']);
            $desc = $car['desc'];
            $end = count($car['photo']);
            for ($i = 0; $i < $end; $i++) {
                $photo[$i] = $car['photo'][$i][0];
            }
            $end = count($car['info']);
            for ($i = 0; $i < $end; $i++) {
                $info[$i] = str_replace("\n", ', ', rtrim($car['info'][$i][0], "\n "));
            }

            $photos = implode(",", $photo);
            $infos = str_replace(",   ", ', ', implode(";", $info));

            $update = "UPDATE cars SET seller='$seller', photos='$photos',description='$desc',info='$infos'  WHERE link='$link'";

            if ($mysqli->query($update) === TRUE) {
                echo json_encode(['success' => 'Database update']);
            } else {
                //echo "Error: " . $update . "<br>" . $mysqli->error;
                die(json_encode(['error' => 'MySQL error']));
            }
        } else {
            echo json_encode(['error' => 'notFound']);
        }
    }

    public function getItems()
    {
        $config = require_once '../system/data/app.php';
        $mysqli = new mysqli($config['dbhost'], $config['dbuser'], $config['dbpass'], $config['dbname']);

        $select = "SELECT * FROM cars WHERE purchased=0";
        $data = $mysqli->query($select)->fetch_all(MYSQLI_ASSOC);
        echo json_encode($data);

    }

    public function getItem($id)
    {
        $config = require_once '../system/data/app.php';
        $mysqli = new mysqli($config['dbhost'], $config['dbuser'], $config['dbpass'], $config['dbname']);

        $select = "SELECT * FROM cars WHERE id=$id";
        $data = $mysqli->query($select)->fetch_all(MYSQLI_ASSOC);
        echo json_encode($data);
    }

    public function notFound()
    {
        echo json_encode(['error' => 'Not found']);
    }

    private function full_trim($str)
    {
        return trim(preg_replace('/\s{2,}/', '', $str));
    }

}

$api = new Api;