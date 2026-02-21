library(OptimalCutpoints)
library(dtComb)
if (!require("jsonlite")) install.packages("jsonlite")
library(jsonlite)

createROCPlot <- function(input, output = NULL, session = NULL) {
  # Tüm süreci sessizce yönetmek ve hataları yakalamak için tryCatch
  result <- tryCatch({
    temp_plot <- tempfile()
    png(temp_plot) # Çizimleri geçici bir dosyaya hapseder
    # Giriş verilerini hazırla
    input$event <- "needed"
    data_text <- input$markers
    raw_sep <- input$delimiter
    sep_char <- if(!is.null(raw_sep) && nchar(as.character(raw_sep)) == 1) as.character(raw_sep) else "\t"

    # Veri tablosunu oku
    df <- read.table(text = data_text, header = TRUE, sep = sep_char, check.names = FALSE)

    if (nrow(df) == 0) stop("Veri tablosu boş!")

    if (input$`function` == "linComb") {
      # Analiz motorunu çalıştır
      modelFit <- linComb(
        markers = as.data.frame(df[, -1]),
        status = as.factor(df[, 1]),
        event = "needed",
        method = as.character(input$method),
        resample = as.character(input$resampling),
        show.plot = FALSE,
        standardize = input$standardization,
        direction = as.character(input$direction),
        cutoff.method = as.character(input$cutoffMethod),
        nfolds = as.integer(input$nfolds),
        nrepeats = as.integer(input$nrepeats),
        niters = as.integer(input$niters),
        ndigits = as.integer(input$ndigits),
        conf.level = as.numeric(input$confLevel)
      )

      # Python tarafına gönderilecek tabloları hazırla
      auc_df <- as.data.frame(modelFit$AUC_table)
      auc_df$Marker <- rownames(auc_df)

      # Katsayı isimlerini güvenli (standardize) hale getir
      coeffs <- if(!is.null(modelFit$fit$Parameters)) {
        p <- modelFit$fit$Parameters
        names(p) <- make.names(names(p))
        as.list(p)
      } else {
        list()
      }
# R tarafında isimli bir liste oluşturuyoruz
      output_for_python <- list(
        roc_data = as.data.frame(modelFit$ROC_coordinates),
        auc_data = as.data.frame(modelFit$AUC_table),
        thresholds = list(
          marker1 = as.numeric(modelFit$ThresholdMarker1[1]),
          marker2 = as.numeric(modelFit$ThresholdMarker2[1]),
          combined = as.numeric(modelFit$ThresholdCombined[1])
        ),
        coefficients = if(!is.null(modelFit$fit$Parameters)) as.list(modelFit$fit$Parameters) else list()
      )

      # İsimleri manuel olarak tekrar ata (İsim çakışmalarını önlemek için kritik)
      names(output_for_python) <- c("roc_data", "auc_data", "thresholds", "coefficients")

      return(jsonlite::toJSON(list(
        roc_data = as.data.frame(modelFit$ROC_coordinates),
        auc_data = as.data.frame(modelFit$AUC_table, stringsAsFactors=FALSE),
        thresholds = list(
          marker1 = as.numeric(modelFit$ThresholdMarker1[1]),
          marker2 = as.numeric(modelFit$ThresholdMarker2[1]),
          combined = as.numeric(modelFit$ThresholdCombined[1])
        ),
        coefficients = if(!is.null(modelFit$fit$Parameters)) as.list(modelFit$fit$Parameters) else list()
      )))

    } else {
      stop(paste("Tanımlanmayan fonksiyon tipi:", input$`function`))
    }

  }, error = function(e) {
    # Hata durumunda Python tarafına temiz bir hata mesajı fırlat
    stop(e$message)
  })
    dev.off()
    unlink(temp_plot) # Geçici dosyayı siler
  return(result)
}