# 1. Kütüphaneleri yükle
library(dtComb)
if (!require("jsonlite")) install.packages("jsonlite", repos='http://cran.us.r-project.org')
library(jsonlite)

# 2. Argümanları al
myArgs <- commandArgs(trailingOnly = TRUE)
dataName <- "laparotomy" # Varsayılan değer

if (length(myArgs) > 0) {
    dataName <- myArgs[1]
}
message(paste("R'a Gelen Veri Seti İsmi:", dataName))
# 3. Veriyi Yükle (Düzeltme: list parametresini kullanmalısınız)
# data(dataName) derseniz R "dataName" adlı bir dosya arar.
# data(list = dataName) derseniz değişkenin içindeki değeri (örn: "laparotomy") arar.
data(list = dataName, package = "dtComb")

# 4. Veriyi Nesneye Dönüştür ve JSON Olarak Bas
# Düzeltme: cat(toJSON(exampleData2)) yerine dinamik değişkeni kullanın
dynamicData <- get(dataName)
dataColnames <- colnames(dynamicData)
selectedStatus <- ""
selectedCategory <- ""
selectedMarker1 <- ""
selectedMarker2 <- ""

if(dataName == "laparotomy"){
  selectedStatus <- "group"
  selectedCategory <- "needed"
  selectedMarker1 <- "ddimer"
  selectedMarker2 <- "log_leukocyte"
} else if(dataName == "exampleData2"){
  selectedStatus <- "Group"
  selectedCategory <- "carriers"
  selectedMarker1 <- "m1"
  selectedMarker2 <- "m2"
} else if(dataName == "exampleData3"){
  selectedStatus <- "status"
  selectedCategory <- "diseased"
  selectedMarker1 <- "marker1"
  selectedMarker2 <- "marker2"
}

categories <- if(selectedStatus %in% colnames(dynamicData)) unique(dynamicData[[selectedStatus]]) else list()

outputList <- list(
  data = dynamicData,
  columns = dataColnames,
  categories = categories,
  selectedCategory = selectedCategory,
  selectedStatus = selectedStatus,
  selectedMarker1 = selectedMarker1,
  selectedMarker2 = selectedMarker2
)
cat(toJSON(outputList,, auto_unbox = TRUE))