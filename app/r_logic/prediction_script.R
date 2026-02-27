library(OptimalCutpoints)
library(dtComb)
if (!require("jsonlite")) install.packages("jsonlite")
library(jsonlite)

predictData <- function(input) {

    data_text <- input$uploadedData
    raw_sep <- input$delimiter
    sep_char <- if(!is.null(raw_sep) && nchar(as.character(raw_sep)) == 1) as.character(raw_sep) else "\t"

    # Veri tablosunu oku
    df <- read.table(text = data_text, header = TRUE, sep = sep_char, check.names = FALSE)

    # 1. Önce metin içindeki [ ve ] karakterlerini sil
    cleaned_scores <- gsub("\\[|\\]", "", as.character(input$analysisData$CombScore))

    # 2. Şimdi sayıya çevir ve vektör yap
    input$analysisData$CombScore <- as.numeric(cleaned_scores)

    modelFit <- input$analysisData
#     modelFit <- fromJSON(input$analysisData, simplifyVector = TRUE)
    class(modelFit) <- "dtComb"
    predict_result <- predict(modelFit,df)
    colnames(predict_result) <- c("combScore","label")
    # Tüm süreci sessizce yönetmek ve hataları yakalamak için tryCatch

    return(jsonlite::toJSON(predict_result, pretty = TRUE, auto_unbox = TRUE, force = TRUE))
}

# Analiz sonucunu (res_analiz) predict fonksiyonuna uyumlu hale getiriyoruz
map_model_to_predict <- function(res_analiz) {

  # 1. Ana Fit Parametrelerini Maple
  res_analiz$fit$CombType <- res_analiz$fit$combType
  res_analiz$fit$Method   <- res_analiz$fit$method
  res_analiz$fit$Parameters <- res_analiz$fit$parameters

  # 2. Eğer Non-Lineer model ise ek parametreleri maple
  if (!is.null(res_analiz$fit$degree1)) {
    res_analiz$fit$Degree1 <- res_analiz$fit$degree1
    res_analiz$fit$Degree2 <- res_analiz$fit$degree2
    res_analiz$fit$Interact <- res_analiz$fit$interact
  }

  # 3. Eğer Math model (distance vb.) ise maple
  if (!is.null(res_analiz$fit$distance)) {
    res_analiz$fit$Distance <- res_analiz$fit$distance
    res_analiz$fit$Transform <- res_analiz$fit$transform
    res_analiz$fit$MaxPower <- res_analiz$fit$maxPower
  }

  # 4. Sınıflandırma ve Eşik Değeri Maple
  res_analiz$fit$Classification <- res_analiz$fit$classification
  res_analiz$ThresholdCombined <- res_analiz$thresholds$combined # En kritik eşleme burası

  return(res_analiz)
}